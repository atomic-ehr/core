/**
 * Plugin scoping system
 * Manages context encapsulation for plugins (similar to Fastify's encapsulation)
 */

import type { AtomicContext, ResourceSchema } from "../index.js";
import type { PluginRegistrationContext } from "./types.js";
import type { DecoratorRegistry } from "./decorator.js";

/**
 * Scoped context for plugin encapsulation
 * Each plugin gets its own context that inherits from parent
 */
export interface ScopedContext<Schema extends ResourceSchema = any>
  extends AtomicContext<Schema> {
  /** Parent context (if this is a child scope) */
  readonly parent?: ScopedContext<Schema>;

  /** Plugin that owns this scope */
  readonly plugin?: PluginRegistrationContext;

  /** Child scopes created within this scope */
  readonly children: ScopedContext<Schema>[];

  /** Scope-specific decorators */
  readonly decorators: DecoratorRegistry;

  /** Create a child scope */
  createChildScope(plugin?: PluginRegistrationContext): ScopedContext<Schema>;

  /** Get value from this scope or parent scopes */
  resolve<T = any>(key: string): T | undefined;

  /** Check if key exists in this scope or parent scopes */
  has(key: string): boolean;
}

/**
 * Scope manager for managing plugin scopes
 */
export class ScopeManager<Schema extends ResourceSchema = any> {
  private rootScope: ScopedContext<Schema> | null = null;
  private currentScope: ScopedContext<Schema> | null = null;
  private scopes: Map<string, ScopedContext<Schema>> = new Map();

  /**
   * Initialize the root scope
   */
  initializeRoot(context: AtomicContext<Schema>): ScopedContext<Schema> {
    if (this.rootScope) {
      throw new Error("Root scope already initialized");
    }

    this.rootScope = this.createScope(context);
    this.currentScope = this.rootScope;
    return this.rootScope;
  }

  /**
   * Get the root scope
   */
  getRoot(): ScopedContext<Schema> {
    if (!this.rootScope) {
      throw new Error("Root scope not initialized");
    }
    return this.rootScope;
  }

  /**
   * Get the current scope
   */
  getCurrent(): ScopedContext<Schema> {
    if (!this.currentScope) {
      throw new Error("No current scope set");
    }
    return this.currentScope;
  }

  /**
   * Enter a new scope (for plugin encapsulation)
   */
  enterScope(plugin: PluginRegistrationContext): ScopedContext<Schema> {
    const parent = this.currentScope;
    if (!parent) {
      throw new Error("Cannot enter scope without current scope");
    }

    const newScope = parent.createChildScope(plugin);
    this.currentScope = newScope;
    this.scopes.set(plugin.metadata.name, newScope);

    return newScope;
  }

  /**
   * Exit the current scope and return to parent
   */
  exitScope(): void {
    if (!this.currentScope || !this.currentScope.parent) {
      throw new Error("Cannot exit root scope");
    }

    this.currentScope = this.currentScope.parent;
  }

  /**
   * Get scope by plugin name
   */
  getScope(pluginName: string): ScopedContext<Schema> | undefined {
    return this.scopes.get(pluginName);
  }

  /**
   * Create a scoped context
   */
  private createScope(
    baseContext: AtomicContext<Schema>,
    parent?: ScopedContext<Schema>,
    plugin?: PluginRegistrationContext
  ): ScopedContext<Schema> {
    const children: ScopedContext<Schema>[] = [];

    // Create a proxy that inherits from parent
    const scope: any = Object.create(parent || baseContext);

    // Add scope-specific properties
    Object.defineProperties(scope, {
      parent: {
        value: parent,
        enumerable: true,
        writable: false,
      },
      plugin: {
        value: plugin,
        enumerable: true,
        writable: false,
      },
      children: {
        value: children,
        enumerable: true,
        writable: false,
      },
      createChildScope: {
        value: (childPlugin?: PluginRegistrationContext) => {
          const childScope = this.createScope(
            baseContext,
            scope,
            childPlugin
          );
          children.push(childScope);
          return childScope;
        },
        enumerable: true,
        writable: false,
      },
      resolve: {
        value: function <T = any>(key: string): T | undefined {
          if (key in this) {
            return this[key];
          }
          if (parent) {
            return parent.resolve(key);
          }
          return undefined;
        },
        enumerable: true,
        writable: false,
      },
      has: {
        value: function (key: string): boolean {
          if (key in this) {
            return true;
          }
          if (parent) {
            return parent.has(key);
          }
          return false;
        },
        enumerable: true,
        writable: false,
      },
    });

    return scope as ScopedContext<Schema>;
  }

  /**
   * Get scope hierarchy as array
   */
  getHierarchy(scope?: ScopedContext<Schema>): ScopedContext<Schema>[] {
    const target = scope || this.currentScope;
    if (!target) {
      return [];
    }

    const hierarchy: ScopedContext<Schema>[] = [target];
    let current = target.parent;

    while (current) {
      hierarchy.unshift(current);
      current = current.parent;
    }

    return hierarchy;
  }

  /**
   * Clear all scopes (useful for testing)
   */
  clear(): void {
    this.rootScope = null;
    this.currentScope = null;
    this.scopes.clear();
  }
}

/**
 * Default global scope manager
 */
export const defaultScopeManager = new ScopeManager();
