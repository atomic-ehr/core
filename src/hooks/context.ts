/**
 * Hook context implementation with control flow methods
 * Provides context augmentation and control flow capabilities
 */

import type {
  AppContext,
  Diagnostic,
  HookContext,
  HookExecutionState,
  RequestContext,
  ResponseContext,
} from "./types.js";

/**
 * Implementation of hook context control flow
 * This is mixed into request contexts to provide hook control capabilities
 */
export class HookContextImpl implements HookContext {
  private state: HookExecutionState;

  constructor(state: HookExecutionState) {
    this.state = state;
  }

  stopPropagation(): void {
    this.state.stopped = true;
  }

  takeOver(): void {
    this.state.takenOver = true;
    this.state.stopped = true; // Taking over also stops execution
  }

  skip(): void {
    this.state.skipped = true;
  }

  setResponse(response: ResponseContext): void {
    this.state.response = response;
  }

  addDiagnostic(diagnostic: Diagnostic): void {
    this.state.diagnostics.push(diagnostic);
  }
}

/**
 * Augments a context object with hook control flow methods
 */
export function augmentContextWithHooks<T extends Record<string, any>>(
  context: T,
  state: HookExecutionState,
): T & HookContext {
  const hookContext = new HookContextImpl(state);

  return Object.assign(context, {
    stopPropagation: hookContext.stopPropagation.bind(hookContext),
    takeOver: hookContext.takeOver.bind(hookContext),
    skip: hookContext.skip.bind(hookContext),
    setResponse: hookContext.setResponse.bind(hookContext),
    addDiagnostic: hookContext.addDiagnostic.bind(hookContext),
  });
}

/**
 * Creates a new hook execution state
 */
export function createHookExecutionState(): HookExecutionState {
  return {
    stopped: false,
    takenOver: false,
    skipped: false,
    response: undefined,
    diagnostics: [],
  };
}

/**
 * Utility functions for context creation
 */
export class ContextFactory {
  /**
   * Creates a base context with common properties
   */
  static createBaseContext(options: {
    requestId: string;
    logger: any;
    clock: any;
    config: any;
    events: any;
  }) {
    return {
      requestId: options.requestId,
      startTime: options.clock.now(),
      logger: options.logger,
      clock: options.clock,
      config: options.config,
      events: options.events,
    };
  }

  /**
   * Creates an application context
   */
  static createAppContext(
    baseContext: any,
    options: {
      services?: Map<string, any>;
      packages?: Map<string, any>;
      routes?: Map<string, any>;
    } = {},
  ): AppContext {
    return {
      ...baseContext,
      services: options.services || new Map(),
      packages: options.packages || new Map(),
      routes: options.routes || new Map(),
    };
  }

  /**
   * Creates a request context
   */
  static createRequestContext(
    appContext: AppContext,
    options: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
      body?: unknown;
      resourceType?: string;
      operation?: string;
    },
  ): RequestContext {
    return {
      ...appContext,
      method: options.method,
      url: options.url,
      headers: options.headers || {},
      params: options.params || {},
      query: options.query || {},
      body: options.body,
      resourceType: options.resourceType,
      operation: options.operation,
    };
  }

  /**
   * Creates a response context
   */
  static createResponseContext(
    requestContext: RequestContext,
    options: {
      statusCode: number;
      responseHeaders?: Record<string, string>;
      responseBody?: unknown;
    },
  ): ResponseContext {
    return {
      ...requestContext,
      statusCode: options.statusCode,
      responseHeaders: options.responseHeaders || {},
      responseBody: options.responseBody,
      duration: requestContext.clock.now() - requestContext.startTime,
    };
  }
}

/**
 * Utility for generating request IDs
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if a context matches hook filters
 */
export function contextMatchesFilters(
  context: RequestContext,
  filters: {
    resourceType?: string;
    profiles?: string[];
    tags?: string[];
  },
): boolean {
  // Check resource type filter
  if (filters.resourceType && filters.resourceType !== "*") {
    if (Array.isArray(filters.resourceType)) {
      if (!filters.resourceType.includes(context.resourceType || "")) {
        return false;
      }
    } else {
      if (filters.resourceType !== context.resourceType) {
        return false;
      }
    }
  }

  // Check profile filters
  if (filters.profiles && filters.profiles.length > 0) {
    // This would need to be implemented based on how profiles are stored in context
    // For now, we'll assume it matches if no profiles specified
    const contextProfiles = (context.body as any)?.meta?.profile || [];
    const hasMatchingProfile = filters.profiles.some((profile) =>
      contextProfiles.includes(profile),
    );
    if (!hasMatchingProfile) {
      return false;
    }
  }

  // Tags are checked at the hook level, not context level
  return true;
}
