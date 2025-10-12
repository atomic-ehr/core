/**
 * Hook system type definitions for @atomic-ehr/core
 * Implements the hook architecture defined in ADR-0001
 */

// Re-export existing context interfaces for compatibility
export type { AtomicContext } from "../index.js";

/**
 * Base context interface that all contexts extend
 */
export interface BaseContext {
  requestId: string;
  startTime: number;
  logger: Logger;
  clock: Clock;
  config: Config;
  events: EventEmitter;
}

/**
 * Application-level context available during server lifecycle
 */
export interface AppContext extends BaseContext {
  services: Map<string, any>;
  packages: Map<string, any>;
  routes: Map<string, any>;
}

/**
 * Request-specific context for HTTP operations
 */
export interface RequestContext extends AppContext {
  method: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: unknown;

  // FHIR-specific properties
  resourceType?: string;
  operation?: string;

  // Control flow methods (added by HookContext)
  stopPropagation?: () => void;
  takeOver?: () => void;
  skip?: () => void;
  setResponse?: (response: ResponseContext) => void;
  addDiagnostic?: (diagnostic: Diagnostic) => void;
}

/**
 * Response context for completed operations
 */
export interface ResponseContext extends RequestContext {
  statusCode: number;
  responseHeaders: Record<string, string>;
  responseBody: unknown;
  duration: number;
}

/**
 * Error context for error handling
 */
export interface ErrorContext extends RequestContext {
  error: Error;
  handled: boolean;
}

/**
 * Hook phases - when hooks execute in the request lifecycle
 * Aligned with Fastify's lifecycle hooks for familiarity
 */
export type HookPhase =
  // Initialization phases
  | "onBootstrap" // Server startup (called once)
  | "onConfigResolved" // After configuration is resolved
  | "onRegister" // Plugin/service registration
  | "onReady" // All plugins registered, before listening
  | "onRouteRegister" // Route registration
  | "onListen" // Server started listening
  // Request lifecycle phases
  | "onRequest" // Request received (alias for preRequest)
  | "preRequest" // Before request processing
  | "preParsing" // Before body parsing
  | "preValidation" // Before validation
  | "preHandler" // Before business logic
  | "preSerialization" // Before response serialization
  | "preResponse" // Before response sent
  | "onResponse" // After successful response
  | "onSend" // Before response is sent (can modify payload)
  | "onTimeout" // Request timeout
  // Error handling
  | "onError" // Error handling
  | "onRequestAbort" // Request was aborted
  // Shutdown phases
  | "onClose" // Server is closing
  | "onShutdown"; // Server shutdown complete

/**
 * Issue severity levels for diagnostics
 */
export type IssueSeverity = "info" | "warn" | "error" | "debug";

/**
 * Diagnostic information for debugging and observability
 */
export interface Diagnostic {
  level: IssueSeverity;
  code: string;
  message: string;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Next function for hook continuation
 */
export interface NextFunction {
  (): Promise<void>;
  (error: Error): Promise<void>;
}

/**
 * Hook handler function signature
 */
export type HookHandler<TContext = any, TResult = any> = (
  context: TContext,
  next: NextFunction,
) => Promise<TResult>;

/**
 * Hook definition interface
 */
export interface HookDefinition<TContext = any, TResult = any> {
  name: string;
  phase: HookPhase;
  priority: number; // Higher = earlier execution
  resources?: string | string[] | "*"; // Resource type filter
  profiles?: string[]; // Profile-specific hooks
  handler: HookHandler<TContext, TResult>;
  deps?: string[]; // Dependency hooks that must run first
  tags?: string[]; // For grouping and conditional execution
}

/**
 * Hook context with control flow capabilities
 */
export interface HookContext {
  stopPropagation(): void; // Prevent subsequent hooks from running
  takeOver(): void; // Stop pipeline and return current response
  skip(): void; // Skip remaining hooks in this phase
  setResponse(response: ResponseContext): void;
  addDiagnostic(diagnostic: Diagnostic): void;
}

/**
 * Hook filters for selecting hooks
 */
export interface HookFilters {
  resourceType?: string;
  profiles?: string[];
  tags?: string[];
}

/**
 * Hook registry interface
 */
export interface HookRegistry {
  register(hook: HookDefinition): void;
  unregister(hookName: string): void;
  getHooks(phase: HookPhase, filters?: HookFilters): HookDefinition[];
  executePhase<T>(phase: HookPhase, context: T): Promise<T>;
  validateDependencies(): void; // Validate dependency graph
  getExecutionPlan(phase: HookPhase): HookDefinition[]; // Sorted by priority & deps
}

/**
 * Hook execution result
 */
export interface HookExecutionResult {
  phase: HookPhase;
  hooksExecuted: string[];
  totalDuration: number;
  stopped: boolean;
  takenOver: boolean;
  skipped: boolean;
  errors: Array<{ hookName: string; error: Error }>;
}

/**
 * Basic service interfaces that contexts depend on
 */
export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

export interface Clock {
  now(): number;
  toISOString(timestamp?: number): string;
}

export interface Config {
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, value: T): void;
  has(key: string): boolean;
}

export interface EventEmitter {
  emit(event: string, ...args: any[]): boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  once(event: string, listener: (...args: any[]) => void): this;
}

/**
 * Hook execution state for tracking control flow
 */
export interface HookExecutionState {
  stopped: boolean;
  takenOver: boolean;
  skipped: boolean;
  response?: ResponseContext;
  diagnostics: Diagnostic[];
}

/**
 * Validation error for hook validation
 */
export class HookValidationError extends Error {
  constructor(
    message: string,
    public hookName?: string,
  ) {
    super(message);
    this.name = "HookValidationError";
  }
}

/**
 * Circular dependency error
 */
export class CircularDependencyError extends Error {
  constructor(cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(" -> ")}`);
    this.name = "CircularDependencyError";
  }
}
