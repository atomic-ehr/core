/**
 * Decorator system for extending Atomic contexts
 * Similar to Fastify's decorator pattern
 */

import type { AtomicContext, ResourceSchema } from "../index.js";
import type { BaseContext, RequestContext, ResponseContext } from "../hooks/types.js";

/**
 * Decorator value can be any type
 */
export type DecoratorValue = any;

/**
 * Decorator getter function
 */
export type DecoratorGetter<T = any> = () => T;

/**
 * Decorator definition
 */
export interface DecoratorDefinition {
  /** Decorator name */
  name: string;

  /** Decorator value or getter function */
  value: DecoratorValue | DecoratorGetter;

  /** Whether this is a getter function */
  isGetter: boolean;

  /** Which plugin added this decorator */
  pluginName?: string;
}

/**
 * Decorator scope
 */
export type DecoratorScope = "server" | "request" | "response" | "context";

/**
 * Decorator registry for managing decorators
 */
export interface DecoratorRegistry {
  /** Add a decorator to the registry */
  add(scope: DecoratorScope, name: string, value: DecoratorValue): void;

  /** Add a decorator getter to the registry */
  addGetter(scope: DecoratorScope, name: string, getter: DecoratorGetter): void;

  /** Get a decorator value */
  get(scope: DecoratorScope, name: string): DecoratorValue | undefined;

  /** Check if a decorator exists */
  has(scope: DecoratorScope, name: string): boolean;

  /** Get all decorators for a scope */
  getAll(scope: DecoratorScope): Map<string, DecoratorDefinition>;

  /** Remove a decorator */
  remove(scope: DecoratorScope, name: string): void;

  /** Apply decorators to a context object */
  apply<T extends Record<string, any>>(scope: DecoratorScope, target: T): T;
}

/**
 * Server-level decorators
 * Extended via declaration merging
 *
 * @example
 * ```ts
 * declare module '@atomic-ehr/core' {
 *   interface ServerDecorators {
 *     database: DatabaseConnection;
 *     cache: CacheService;
 *   }
 * }
 * ```
 */
export interface ServerDecorators {}

/**
 * Request-level decorators
 * Extended via declaration merging
 *
 * @example
 * ```ts
 * declare module '@atomic-ehr/core' {
 *   interface RequestDecorators {
 *     user: User;
 *     session: Session;
 *   }
 * }
 * ```
 */
export interface RequestDecorators {}

/**
 * Response-level decorators
 * Extended via declaration merging
 *
 * @example
 * ```ts
 * declare module '@atomic-ehr/core' {
 *   interface ResponseDecorators {
 *     setCookie(name: string, value: string): void;
 *     sendError(error: Error): void;
 *   }
 * }
 * ```
 */
export interface ResponseDecorators {}

/**
 * Context-level decorators (for AtomicContext)
 * Extended via declaration merging
 *
 * @example
 * ```ts
 * declare module '@atomic-ehr/core' {
 *   interface ContextDecorators<Schema> {
 *     metrics: MetricsCollector;
 *     feature(name: string): boolean;
 *   }
 * }
 * ```
 */
export interface ContextDecorators<Schema extends ResourceSchema = any> {}

/**
 * Extended context types with decorators
 */
export interface DecoratedBaseContext extends BaseContext, ServerDecorators {}

export interface DecoratedRequestContext
  extends RequestContext,
    ServerDecorators,
    RequestDecorators {}

export interface DecoratedResponseContext
  extends ResponseContext,
    ServerDecorators,
    ResponseDecorators {}

export interface DecoratedAtomicContext<Schema extends ResourceSchema = any>
  extends AtomicContext<Schema>,
    ServerDecorators,
    ContextDecorators<Schema> {}

/**
 * Decorator manager class
 */
export class DecoratorManager implements DecoratorRegistry {
  private decorators: Map<DecoratorScope, Map<string, DecoratorDefinition>> =
    new Map();

  constructor() {
    // Initialize decorator maps for each scope
    this.decorators.set("server", new Map());
    this.decorators.set("request", new Map());
    this.decorators.set("response", new Map());
    this.decorators.set("context", new Map());
  }

  add(scope: DecoratorScope, name: string, value: DecoratorValue): void {
    const scopeMap = this.decorators.get(scope);
    if (!scopeMap) {
      throw new Error(`Invalid decorator scope: ${scope}`);
    }

    if (scopeMap.has(name)) {
      throw new Error(
        `Decorator '${name}' already exists in scope '${scope}'`
      );
    }

    scopeMap.set(name, {
      name,
      value,
      isGetter: false,
    });
  }

  addGetter(
    scope: DecoratorScope,
    name: string,
    getter: DecoratorGetter
  ): void {
    const scopeMap = this.decorators.get(scope);
    if (!scopeMap) {
      throw new Error(`Invalid decorator scope: ${scope}`);
    }

    if (scopeMap.has(name)) {
      throw new Error(
        `Decorator '${name}' already exists in scope '${scope}'`
      );
    }

    scopeMap.set(name, {
      name,
      value: getter,
      isGetter: true,
    });
  }

  get(scope: DecoratorScope, name: string): DecoratorValue | undefined {
    const scopeMap = this.decorators.get(scope);
    const decorator = scopeMap?.get(name);

    if (!decorator) {
      return undefined;
    }

    return decorator.isGetter
      ? (decorator.value as DecoratorGetter)()
      : decorator.value;
  }

  has(scope: DecoratorScope, name: string): boolean {
    const scopeMap = this.decorators.get(scope);
    return scopeMap?.has(name) ?? false;
  }

  getAll(scope: DecoratorScope): Map<string, DecoratorDefinition> {
    return this.decorators.get(scope) ?? new Map();
  }

  remove(scope: DecoratorScope, name: string): void {
    const scopeMap = this.decorators.get(scope);
    scopeMap?.delete(name);
  }

  apply<T extends Record<string, any>>(scope: DecoratorScope, target: T): T {
    const scopeMap = this.decorators.get(scope);
    if (!scopeMap) {
      return target;
    }

    for (const [name, decorator] of scopeMap.entries()) {
      if (decorator.isGetter) {
        Object.defineProperty(target, name, {
          get: decorator.value as DecoratorGetter,
          enumerable: true,
          configurable: true,
        });
      } else {
        Object.defineProperty(target, name, {
          value: decorator.value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    }

    return target;
  }
}

/**
 * Helper to create type-safe decorator
 */
export function createDecorator<T = any>(
  name: string,
  value: T
): { name: string; value: T } {
  return { name, value };
}

/**
 * Helper to create type-safe decorator getter
 */
export function createDecoratorGetter<T = any>(
  name: string,
  getter: () => T
): { name: string; getter: () => T } {
  return { name, getter };
}
