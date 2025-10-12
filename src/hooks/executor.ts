/**
 * Hook executor implementation with priority-based execution
 * Handles hook execution, control flow, and error propagation
 */

import {
  augmentContextWithHooks,
  createHookExecutionState,
} from "./context.js";
import type { HookRegistry } from "./registry.js";
import type {
  HookDefinition,
  HookExecutionResult,
  HookExecutionState,
  HookFilters,
  HookPhase,
  Logger,
  NextFunction,
  RequestContext,
} from "./types.js";

/**
 * Hook execution engine
 * Executes hooks in correct order with proper control flow handling
 */
export class HookExecutor {
  constructor(private registry: HookRegistry) {}

  /**
   * Execute all hooks for a given phase
   */
  async executePhase<T extends Record<string, any>>(
    phase: HookPhase,
    context: T,
    filters?: HookFilters,
  ): Promise<T & { _hookResult?: HookExecutionResult }> {
    const startTime = Date.now();
    const executionState = createHookExecutionState();
    const augmentedContext = augmentContextWithHooks(context, executionState);

    // Get hooks for this phase
    let hooks = this.registry.getHooks(phase, filters);

    // Apply context-based filtering for request-specific phases
    if (this.isRequestPhase(phase) && this.isRequestContext(augmentedContext)) {
      hooks = hooks.filter((hook) =>
        this.hookAppliesToContext(hook, augmentedContext),
      );
    }

    const result: HookExecutionResult = {
      phase,
      hooksExecuted: [],
      totalDuration: 0,
      stopped: false,
      takenOver: false,
      skipped: false,
      errors: [],
    };

    try {
      for (const hook of hooks) {
        // Check if execution should stop
        if (executionState.stopped) {
          result.stopped = true;
          break;
        }

        if (executionState.skipped) {
          result.skipped = true;
          break;
        }

        try {
          await this.executeHook(hook, augmentedContext, executionState);
          result.hooksExecuted.push(hook.name);

          // Check if hook took over execution
          if (executionState.takenOver) {
            result.takenOver = true;
            break;
          }
        } catch (error) {
          const hookError =
            error instanceof Error ? error : new Error(String(error));
          result.errors.push({ hookName: hook.name, error: hookError });

          // Log error but continue execution unless it's a critical phase
          if (augmentedContext.logger) {
            augmentedContext.logger.error(
              `Hook '${hook.name}' failed in phase '${phase}'`,
              {
                error: hookError.message,
                stack: hookError.stack,
                phase,
                hookName: hook.name,
              },
            );
          }

          // For error handling phase, we continue; for others, we might stop
          if (phase !== "onError") {
            // Propagate error to onError phase
            throw hookError;
          }
        }
      }

      result.totalDuration = Date.now() - startTime;

      // If a response was set during execution, merge it into context
      if (executionState.response) {
        Object.assign(augmentedContext, executionState.response);
      }

      // Add diagnostics to context if supported
      if (
        executionState.diagnostics.length > 0 &&
        augmentedContext.diagnostics
      ) {
        augmentedContext.diagnostics.push(...executionState.diagnostics);
      } else if (executionState.diagnostics.length > 0) {
        (augmentedContext as any).diagnostics = executionState.diagnostics;
      }

      // Attach execution result for debugging
      (augmentedContext as any)._hookResult = result;

      return augmentedContext;
    } catch (error) {
      result.totalDuration = Date.now() - startTime;
      result.errors.push({
        hookName: "execution",
        error: error instanceof Error ? error : new Error(String(error)),
      });

      // Attach execution result even on error
      (augmentedContext as any)._hookResult = result;

      throw error;
    }
  }

  /**
   * Execute a single hook with proper error handling
   */
  private async executeHook(
    hook: HookDefinition,
    context: any,
    state: HookExecutionState,
  ): Promise<void> {
    const startTime = Date.now();

    // Create next function for hook continuation
    const next: NextFunction = async (error?: Error) => {
      if (error) {
        throw error;
      }
      // Next function doesn't do anything special in this implementation
      // It's here for middleware-style hooks if needed
    };

    try {
      // Execute the hook handler
      const result = await hook.handler(context, next);

      // Some hooks might return values that should be merged into context
      if (result && typeof result === "object" && result !== context) {
        Object.assign(context, result);
      }

      // Add execution diagnostic
      state.diagnostics.push({
        level: "debug",
        code: "hook-executed",
        message: `Hook '${hook.name}' executed successfully`,
        source: "hook-executor",
        timestamp: Date.now(),
        metadata: {
          hookName: hook.name,
          phase: hook.phase,
          duration: Date.now() - startTime,
          priority: hook.priority,
        },
      });
    } catch (error) {
      // Add error diagnostic
      state.diagnostics.push({
        level: "error",
        code: "hook-error",
        message: `Hook '${hook.name}' failed: ${error instanceof Error ? error.message : String(error)}`,
        source: "hook-executor",
        timestamp: Date.now(),
        metadata: {
          hookName: hook.name,
          phase: hook.phase,
          duration: Date.now() - startTime,
          priority: hook.priority,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Check if a hook applies to the current context
   */
  private hookAppliesToContext(
    hook: HookDefinition,
    context: RequestContext,
  ): boolean {
    // Resource type filtering
    if (hook.resources && hook.resources !== "*") {
      if (typeof hook.resources === "string") {
        if (hook.resources !== context.resourceType) {
          return false;
        }
      } else if (Array.isArray(hook.resources)) {
        if (
          !context.resourceType ||
          !hook.resources.includes(context.resourceType)
        ) {
          return false;
        }
      }
    }

    // Profile filtering
    if (hook.profiles && hook.profiles.length > 0) {
      const resourceProfiles = (context.body as any)?.meta?.profile || [];
      const hasMatchingProfile = hook.profiles.some((profile) =>
        resourceProfiles.includes(profile),
      );
      if (!hasMatchingProfile) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if this is a request-specific phase
   */
  private isRequestPhase(phase: HookPhase): boolean {
    const requestPhases: HookPhase[] = [
      "preRequest",
      "preValidation",
      "preHandler",
      "preResponse",
      "onResponse",
      "onError",
    ];
    return requestPhases.includes(phase);
  }

  /**
   * Check if context is a request context
   */
  private isRequestContext(context: any): context is RequestContext {
    return (
      context &&
      typeof context.method === "string" &&
      typeof context.url === "string"
    );
  }
}

/**
 * Utility class for hook execution with timing and metrics
 */
export class HookExecutionMetrics {
  private static executions: Array<{
    phase: HookPhase;
    hookName: string;
    duration: number;
    timestamp: number;
    success: boolean;
  }> = [];

  static recordExecution(
    phase: HookPhase,
    hookName: string,
    duration: number,
    success: boolean,
  ): void {
    HookExecutionMetrics.executions.push({
      phase,
      hookName,
      duration,
      timestamp: Date.now(),
      success,
    });

    // Keep only last 1000 executions to prevent memory leaks
    if (HookExecutionMetrics.executions.length > 1000) {
      HookExecutionMetrics.executions =
        HookExecutionMetrics.executions.slice(-1000);
    }
  }

  static getMetrics(): {
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    slowestHooks: Array<{ hookName: string; averageDuration: number }>;
    phaseMetrics: Record<
      HookPhase,
      { count: number; averageDuration: number; successRate: number }
    >;
  } {
    const total = HookExecutionMetrics.executions.length;
    const successful = HookExecutionMetrics.executions.filter(
      (e) => e.success,
    ).length;
    const totalDuration = HookExecutionMetrics.executions.reduce(
      (sum, e) => sum + e.duration,
      0,
    );

    // Calculate per-hook metrics
    const hookMetrics = new Map<
      string,
      { durations: number[]; successes: number; total: number }
    >();
    HookExecutionMetrics.executions.forEach((execution) => {
      if (!hookMetrics.has(execution.hookName)) {
        hookMetrics.set(execution.hookName, {
          durations: [],
          successes: 0,
          total: 0,
        });
      }
      const metrics = hookMetrics.get(execution.hookName)!;
      metrics.durations.push(execution.duration);
      metrics.total++;
      if (execution.success) {
        metrics.successes++;
      }
    });

    const slowestHooks = Array.from(hookMetrics.entries())
      .map(([hookName, metrics]) => ({
        hookName,
        averageDuration:
          metrics.durations.reduce((sum, d) => sum + d, 0) /
          metrics.durations.length,
      }))
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10);

    // Calculate per-phase metrics
    const phaseMetrics: Record<
      string,
      { count: number; averageDuration: number; successRate: number }
    > = {};
    const phaseGroups = new Map<
      HookPhase,
      Array<{ duration: number; success: boolean }>
    >();

    HookExecutionMetrics.executions.forEach((execution) => {
      if (!phaseGroups.has(execution.phase)) {
        phaseGroups.set(execution.phase, []);
      }
      phaseGroups.get(execution.phase)!.push({
        duration: execution.duration,
        success: execution.success,
      });
    });

    phaseGroups.forEach((executions, phase) => {
      const count = executions.length;
      const averageDuration =
        executions.reduce((sum, e) => sum + e.duration, 0) / count;
      const successRate = executions.filter((e) => e.success).length / count;

      phaseMetrics[phase] = { count, averageDuration, successRate };
    });

    return {
      totalExecutions: total,
      successRate: total > 0 ? successful / total : 0,
      averageDuration: total > 0 ? totalDuration / total : 0,
      slowestHooks,
      phaseMetrics: phaseMetrics as Record<
        HookPhase,
        { count: number; averageDuration: number; successRate: number }
      >,
    };
  }

  static clearMetrics(): void {
    HookExecutionMetrics.executions = [];
  }
}
