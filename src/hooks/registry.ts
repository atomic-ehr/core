/**
 * Hook registry implementation with dependency resolution
 * Manages hook registration, validation, and execution planning
 */

import type {
  HookDefinition,
  HookPhase,
  HookFilters,
  HookRegistry as IHookRegistry
} from './types.js';
import { CircularDependencyError, HookValidationError } from './types.js';

/**
 * Implementation of the hook registry
 * Provides registration, dependency validation, and execution planning
 */
export class HookRegistry implements IHookRegistry {
  private hooks: Map<string, HookDefinition> = new Map();
  private hooksByPhase: Map<HookPhase, HookDefinition[]> = new Map();
  private dependencyGraph: Map<string, string[]> = new Map();

  constructor() {
    // Initialize phase maps
    const phases: HookPhase[] = [
      'onBootstrap', 'onConfigResolved', 'onRegister', 'onRouteRegister',
      'preRequest', 'preValidation', 'preHandler', 'preResponse',
      'onResponse', 'onError', 'onShutdown'
    ];

    phases.forEach(phase => {
      this.hooksByPhase.set(phase, []);
    });
  }

  /**
   * Register a hook in the registry
   */
  register(hook: HookDefinition): void {
    this.validateHook(hook);

    // Check for name conflicts
    if (this.hooks.has(hook.name)) {
      throw new HookValidationError(`Hook with name '${hook.name}' already exists`);
    }

    // Store the hook
    this.hooks.set(hook.name, hook);

    // Add to phase-specific storage
    const phaseHooks = this.hooksByPhase.get(hook.phase) || [];
    phaseHooks.push(hook);
    this.hooksByPhase.set(hook.phase, phaseHooks);

    // Update dependency graph
    this.dependencyGraph.set(hook.name, hook.deps || []);

    // Validate dependencies after registration
    this.validateDependencies();

    // Sort hooks in this phase by priority and dependencies
    this.sortPhaseHooks(hook.phase);
  }

  /**
   * Unregister a hook by name
   */
  unregister(hookName: string): void {
    const hook = this.hooks.get(hookName);
    if (!hook) {
      return; // Silently ignore non-existent hooks
    }

    // Remove from main storage
    this.hooks.delete(hookName);

    // Remove from phase storage
    const phaseHooks = this.hooksByPhase.get(hook.phase) || [];
    const index = phaseHooks.findIndex(h => h.name === hookName);
    if (index >= 0) {
      phaseHooks.splice(index, 1);
    }

    // Remove from dependency graph
    this.dependencyGraph.delete(hookName);

    // Remove this hook from other hooks' dependencies
    for (const [name, deps] of this.dependencyGraph.entries()) {
      const depIndex = deps.indexOf(hookName);
      if (depIndex >= 0) {
        deps.splice(depIndex, 1);
      }
    }

    // Re-sort the affected phase
    this.sortPhaseHooks(hook.phase);
  }

  /**
   * Get hooks for a specific phase with optional filters
   */
  getHooks(phase: HookPhase, filters?: HookFilters): HookDefinition[] {
    const phaseHooks = this.hooksByPhase.get(phase) || [];

    if (!filters) {
      return [...phaseHooks]; // Return copy
    }

    return phaseHooks.filter(hook => this.hookMatchesFilters(hook, filters));
  }

  /**
   * Execute a hook phase (this will be implemented in the executor)
   */
  async executePhase<T>(phase: HookPhase, context: T): Promise<T> {
    // This is a placeholder - actual implementation will be in HookExecutor
    throw new Error('executePhase should be implemented by HookExecutor');
  }

  /**
   * Validate all hook dependencies for circular references
   */
  validateDependencies(): void {
    for (const hookName of this.hooks.keys()) {
      this.checkCircularDependency(hookName, new Set(), []);
    }
  }

  /**
   * Get execution plan for a phase (sorted by priority and dependencies)
   */
  getExecutionPlan(phase: HookPhase): HookDefinition[] {
    return [...(this.hooksByPhase.get(phase) || [])];
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): HookDefinition[] {
    return Array.from(this.hooks.values());
  }

  /**
   * Get hook by name
   */
  getHook(name: string): HookDefinition | undefined {
    return this.hooks.get(name);
  }

  /**
   * Check if a hook is registered
   */
  hasHook(name: string): boolean {
    return this.hooks.has(name);
  }

  /**
   * Validate a hook definition
   */
  private validateHook(hook: HookDefinition): void {
    if (!hook.name || typeof hook.name !== 'string') {
      throw new HookValidationError('Hook name is required and must be a string');
    }

    if (!hook.phase) {
      throw new HookValidationError(`Hook '${hook.name}' must specify a phase`);
    }

    if (typeof hook.priority !== 'number') {
      throw new HookValidationError(`Hook '${hook.name}' priority must be a number`);
    }

    if (typeof hook.handler !== 'function') {
      throw new HookValidationError(`Hook '${hook.name}' handler must be a function`);
    }

    // Validate phase
    const validPhases: HookPhase[] = [
      'onBootstrap', 'onConfigResolved', 'onRegister', 'onRouteRegister',
      'preRequest', 'preValidation', 'preHandler', 'preResponse',
      'onResponse', 'onError', 'onShutdown'
    ];

    if (!validPhases.includes(hook.phase)) {
      throw new HookValidationError(
        `Hook '${hook.name}' has invalid phase '${hook.phase}'. Valid phases: ${validPhases.join(', ')}`
      );
    }

    // Validate dependencies exist (for registered hooks)
    if (hook.deps) {
      for (const dep of hook.deps) {
        if (!this.hooks.has(dep)) {
          throw new HookValidationError(
            `Hook '${hook.name}' depends on '${dep}' which is not registered`
          );
        }
      }
    }

    // Validate resource filters
    if (hook.resources) {
      if (typeof hook.resources === 'string') {
        if (hook.resources !== '*' && !/^[A-Z][a-zA-Z]*$/.test(hook.resources)) {
          throw new HookValidationError(
            `Hook '${hook.name}' has invalid resource type '${hook.resources}'`
          );
        }
      } else if (Array.isArray(hook.resources)) {
        for (const resource of hook.resources) {
          if (typeof resource !== 'string' || (resource !== '*' && !/^[A-Z][a-zA-Z]*$/.test(resource))) {
            throw new HookValidationError(
              `Hook '${hook.name}' has invalid resource type '${resource}'`
            );
          }
        }
      } else {
        throw new HookValidationError(
          `Hook '${hook.name}' resources must be a string, array, or '*'`
        );
      }
    }
  }

  /**
   * Check for circular dependencies using DFS
   */
  private checkCircularDependency(
    hookName: string,
    visited: Set<string>,
    path: string[]
  ): void {
    if (path.includes(hookName)) {
      const cycle = path.slice(path.indexOf(hookName));
      cycle.push(hookName);
      throw new CircularDependencyError(cycle);
    }

    if (visited.has(hookName)) {
      return; // Already processed
    }

    visited.add(hookName);
    path.push(hookName);

    const dependencies = this.dependencyGraph.get(hookName) || [];
    for (const dep of dependencies) {
      this.checkCircularDependency(dep, visited, [...path]);
    }
  }

  /**
   * Sort hooks in a phase by priority and dependencies
   */
  private sortPhaseHooks(phase: HookPhase): void {
    const hooks = this.hooksByPhase.get(phase) || [];
    const sorted = this.topologicalSort(hooks);
    this.hooksByPhase.set(phase, sorted);
  }

  /**
   * Topological sort with priority consideration
   */
  private topologicalSort(hooks: HookDefinition[]): HookDefinition[] {
    const hookNames = new Set(hooks.map(h => h.name));
    const inDegree = new Map<string, number>();
    const adjacencyList = new Map<string, string[]>();

    // Initialize
    for (const hook of hooks) {
      inDegree.set(hook.name, 0);
      adjacencyList.set(hook.name, []);
    }

    // Build graph and calculate in-degrees
    for (const hook of hooks) {
      for (const dep of hook.deps || []) {
        if (hookNames.has(dep)) {
          adjacencyList.get(dep)!.push(hook.name);
          inDegree.set(hook.name, inDegree.get(hook.name)! + 1);
        }
      }
    }

    // Create priority queue (higher priority first)
    const queue = hooks
      .filter(hook => inDegree.get(hook.name) === 0)
      .sort((a, b) => b.priority - a.priority);

    const result: HookDefinition[] = [];
    const hookMap = new Map(hooks.map(h => [h.name, h]));

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Process dependents
      const dependents = adjacencyList.get(current.name) || [];
      const newReadyHooks: HookDefinition[] = [];

      for (const dependent of dependents) {
        inDegree.set(dependent, inDegree.get(dependent)! - 1);

        if (inDegree.get(dependent) === 0) {
          const dependentHook = hookMap.get(dependent)!;
          newReadyHooks.push(dependentHook);
        }
      }

      // Sort new ready hooks by priority and add to queue
      newReadyHooks.sort((a, b) => b.priority - a.priority);
      queue.push(...newReadyHooks);
      queue.sort((a, b) => b.priority - a.priority);
    }

    return result;
  }

  /**
   * Check if a hook matches the given filters
   */
  private hookMatchesFilters(hook: HookDefinition, filters: HookFilters): boolean {
    // Resource type filter
    if (filters.resourceType) {
      if (!hook.resources || hook.resources === '*') {
        // Hook applies to all resources, so it matches
      } else if (typeof hook.resources === 'string') {
        if (hook.resources !== filters.resourceType) {
          return false;
        }
      } else if (Array.isArray(hook.resources)) {
        if (!hook.resources.includes(filters.resourceType)) {
          return false;
        }
      }
    }

    // Profile filter
    if (filters.profiles && filters.profiles.length > 0) {
      if (!hook.profiles || hook.profiles.length === 0) {
        // Hook doesn't specify profiles, so it matches
      } else {
        const hasMatchingProfile = filters.profiles.some(profile =>
          hook.profiles!.includes(profile)
        );
        if (!hasMatchingProfile) {
          return false;
        }
      }
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      if (!hook.tags || hook.tags.length === 0) {
        return false; // Hook must have tags to match tag filter
      } else {
        const hasMatchingTag = filters.tags.some(tag =>
          hook.tags!.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
    }

    return true;
  }
}