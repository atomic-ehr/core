/**
 * Hooks system main module
 * Provides the primary API for the hook system
 */

export * from "./context.js";
export { HookExecutionMetrics, HookExecutor } from "./executor.js";
export { HookRegistry } from "./registry.js";
export * from "./types.js";

import { HookExecutor } from "./executor.js";
import { HookRegistry } from "./registry.js";
import type { HookDefinition, HookFilters, HookPhase } from "./types.js";

/**
 * Main hooks manager that combines registry and executor
 * This is the primary interface for managing hooks
 */
export class HooksManager {
  private registry: HookRegistry;
  private executor: HookExecutor;

  constructor() {
    this.registry = new HookRegistry();
    this.executor = new HookExecutor(this.registry);
  }

  /**
   * Register a hook
   */
  register(hook: HookDefinition): void {
    this.registry.register(hook);
  }

  /**
   * Unregister a hook by name
   */
  unregister(hookName: string): void {
    this.registry.unregister(hookName);
  }

  /**
   * Execute all hooks for a phase
   */
  async executePhase<T extends Record<string, any>>(
    phase: HookPhase,
    context: T,
    filters?: HookFilters,
  ): Promise<T> {
    return this.executor.executePhase(phase, context, filters);
  }

  /**
   * Get hooks for a phase
   */
  getHooks(phase: HookPhase, filters?: HookFilters): HookDefinition[] {
    return this.registry.getHooks(phase, filters);
  }

  /**
   * Get execution plan for a phase
   */
  getExecutionPlan(phase: HookPhase): HookDefinition[] {
    return this.registry.getExecutionPlan(phase);
  }

  /**
   * Validate all hook dependencies
   */
  validateDependencies(): void {
    this.registry.validateDependencies();
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): HookDefinition[] {
    return this.registry.getAllHooks();
  }

  /**
   * Get hook by name
   */
  getHook(name: string): HookDefinition | undefined {
    return this.registry.getHook(name);
  }

  /**
   * Check if a hook is registered
   */
  hasHook(name: string): boolean {
    return this.registry.hasHook(name);
  }

  /**
   * Get the underlying registry (for advanced usage)
   */
  getRegistry(): HookRegistry {
    return this.registry;
  }

  /**
   * Get the underlying executor (for advanced usage)
   */
  getExecutor(): HookExecutor {
    return this.executor;
  }
}

/**
 * Helper function to create a hook definition
 * Provides a more convenient API for defining hooks
 */
export function defineHook<TContext = any, TResult = any>(
  definition: HookDefinition<TContext, TResult>,
): HookDefinition<TContext, TResult> {
  return definition;
}

/**
 * Utility functions for common hook patterns
 */
export class HookUtils {
  /**
   * Create a hook that only executes for specific resource types
   */
  static forResources(
    resourceTypes: string | string[],
    hook: Omit<HookDefinition, "resources">,
  ): HookDefinition {
    return {
      ...hook,
      resources: resourceTypes,
    };
  }

  /**
   * Create a hook that only executes for specific profiles
   */
  static forProfiles(
    profiles: string[],
    hook: Omit<HookDefinition, "profiles">,
  ): HookDefinition {
    return {
      ...hook,
      profiles,
    };
  }

  /**
   * Create a hook with specific tags
   */
  static withTags(
    tags: string[],
    hook: Omit<HookDefinition, "tags">,
  ): HookDefinition {
    return {
      ...hook,
      tags,
    };
  }

  /**
   * Create a hook with dependencies
   */
  static withDependencies(
    dependencies: string[],
    hook: Omit<HookDefinition, "deps">,
  ): HookDefinition {
    return {
      ...hook,
      deps: dependencies,
    };
  }

  /**
   * Create a conditional hook that only executes when condition is met
   */
  static conditional<TContext = any>(
    condition: (context: TContext) => boolean,
    hook: HookDefinition<TContext>,
  ): HookDefinition<TContext> {
    const originalHandler = hook.handler;

    return {
      ...hook,
      handler: async (context, next) => {
        if (condition(context)) {
          return originalHandler(context, next);
        }
        // Skip execution if condition not met
        return;
      },
    };
  }

  /**
   * Create a hook that logs its execution
   */
  static withLogging<TContext extends { logger?: any } = any>(
    hook: HookDefinition<TContext>,
    logLevel: "debug" | "info" | "warn" | "error" = "debug",
  ): HookDefinition<TContext> {
    const originalHandler = hook.handler;

    return {
      ...hook,
      handler: async (context, next) => {
        const startTime = Date.now();

        if (context.logger) {
          context.logger[logLevel](
            `Executing hook '${hook.name}' in phase '${hook.phase}'`,
          );
        }

        try {
          const result = await originalHandler(context, next);

          if (context.logger) {
            context.logger[logLevel](
              `Hook '${hook.name}' completed in ${Date.now() - startTime}ms`,
            );
          }

          return result;
        } catch (error) {
          if (context.logger) {
            context.logger.error(
              `Hook '${hook.name}' failed after ${Date.now() - startTime}ms:`,
              error,
            );
          }
          throw error;
        }
      },
    };
  }

  /**
   * Create a hook that measures execution time
   */
  static withTiming<
    TContext extends { addDiagnostic?: (d: any) => void } = any,
  >(hook: HookDefinition<TContext>): HookDefinition<TContext> {
    const originalHandler = hook.handler;

    return {
      ...hook,
      handler: async (context, next) => {
        const startTime = Date.now();

        try {
          const result = await originalHandler(context, next);
          const duration = Date.now() - startTime;

          if (context.addDiagnostic) {
            context.addDiagnostic({
              level: "debug",
              code: "hook-timing",
              message: `Hook '${hook.name}' executed in ${duration}ms`,
              source: "hook-utils",
              timestamp: Date.now(),
              metadata: { hookName: hook.name, duration, phase: hook.phase },
            });
          }

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;

          if (context.addDiagnostic) {
            context.addDiagnostic({
              level: "error",
              code: "hook-error-timing",
              message: `Hook '${hook.name}' failed after ${duration}ms`,
              source: "hook-utils",
              timestamp: Date.now(),
              metadata: {
                hookName: hook.name,
                duration,
                phase: hook.phase,
                error: String(error),
              },
            });
          }

          throw error;
        }
      },
    };
  }
}

/**
 * Default global hooks manager instance
 * Can be used for simple scenarios where only one hooks manager is needed
 */
export const defaultHooksManager = new HooksManager();

/**
 * Convenience functions that use the default hooks manager
 */
export const registerHook = (hook: HookDefinition) =>
  defaultHooksManager.register(hook);
export const unregisterHook = (hookName: string) =>
  defaultHooksManager.unregister(hookName);
export const executeHooks = <T extends Record<string, any>>(
  phase: HookPhase,
  context: T,
  filters?: HookFilters,
) => defaultHooksManager.executePhase(phase, context, filters);
