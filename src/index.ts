// Import type system
import type {
  DefaultSchema,
  ResourceOf,
  ResourceSchema,
  ResourceTypeOf,
  SearchParamsOf,
} from "./types/index.js";

// Export type system for users
export * from "./types/index.js";

// ============= BASE RESOURCE INTERFACES =============

/**
 * Base resource interface (backward compatibility)
 */
export interface Resource {
  id?: string;
  resourceType?: string;
  resourceDefinition?: string;
}

/**
 * Canonical resource interface
 */
export interface Canonical extends Resource {
  url: string;
  version: string;
}

// ============= BASE SERVICE INTERFACE =============

/**
 * Base interface for all atomic services
 * All services must implement initialization and cleanup
 */
export interface AtomicService {
  dependencies: string[];
  capabilities: string[];
  init(): Promise<void>;
  destroy(): Promise<void>;
}

// ============= VALIDATION =============

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validator service interface
 * Provides resource validation capabilities
 *
 * @template Schema - Resource schema for type-safe validation
 *
 * @example
 * ```ts
 * // Extend with custom methods via declaration merging:
 * declare module '@atomic-ehr/core' {
 *   interface ValidatorExtensions {
 *     validateWithAI(resource: any): Promise<ValidationResult>;
 *   }
 * }
 * ```
 */
export type ValidatorExtensions<Schema extends ResourceSchema = DefaultSchema> =
  {};

export interface ValidatorBase<Schema extends ResourceSchema = DefaultSchema>
  extends AtomicService {
  /**
   * Validate a resource against a profile
   */
  validate<T extends ResourceTypeOf<Schema>>(opts: {
    resource: ResourceOf<Schema, T>;
    profile?: string;
  }): ValidationResult;

  /**
   * Validate a resource by type
   */
  validateResource<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    resource: ResourceOf<Schema, T>;
  }): ValidationResult;

  // Users can extend via declaration merging
}

export interface Validator<Schema extends ResourceSchema = DefaultSchema>
  extends ValidatorBase<Schema>,
    ValidatorExtensions<Schema> {}

// ============= TERMINOLOGY =============

/**
 * Code system concept
 */
export interface CodeSystemConcept {
  code: string;
  display: string;
  definition?: string;
}

/**
 * Value set expansion
 */
export interface ValueSetExpansion {
  contains: Array<{
    system: string;
    code: string;
    display?: string;
  }>;
}

/**
 * Code validation result
 */
export interface CodeValidationResult {
  result: boolean;
  message?: string;
  display?: string;
}

/**
 * Terminology service interface
 * Provides terminology operations (lookup, expand, validate)
 *
 * @template Schema - Resource schema
 *
 * @example
 * ```ts
 * // Extend with custom methods:
 * declare module '@atomic-ehr/core' {
 *   interface TerminologyExtensions {
 *     lookupSNOMED(code: string): Promise<SNOMEDConcept>;
 *     translateCode(opts: TranslateOpts): Promise<Translation>;
 *   }
 * }
 * ```
 */
export type TerminologyExtensions<
  Schema extends ResourceSchema = DefaultSchema,
> = {};

export interface TerminologyBase<Schema extends ResourceSchema = DefaultSchema>
  extends AtomicService {
  /**
   * Look up a code in a code system
   */
  lookup(opts: {
    code: string;
    system: string;
    version?: string;
  }): Promise<CodeSystemConcept>;

  /**
   * Expand a value set
   */
  expand(opts: { url: string; filter?: string }): Promise<ValueSetExpansion>;

  /**
   * Validate a code against a value set
   */
  validateCode(opts: {
    code: string;
    system: string;
    valueSet?: string;
  }): Promise<CodeValidationResult>;

  // Users can extend via declaration merging
}

export interface Terminology<Schema extends ResourceSchema = DefaultSchema>
  extends TerminologyBase<Schema>,
    TerminologyExtensions<Schema> {}

// ============= FHIRPATH =============

/**
 * Compiled FHIRPath expression
 */
export interface CompiledExpression {
  expression: string;
  compiled: any;
}

/**
 * FHIRPath expression analysis result
 */
export interface ExpressionAnalysis {
  expression: string;
  valid: boolean;
  returnType?: string;
  errors?: string[];
}

/**
 * FHIRPath evaluator service interface
 * Provides FHIRPath expression evaluation
 *
 * @template Schema - Resource schema
 *
 * @example
 * ```ts
 * // Extend with custom methods:
 * declare module '@atomic-ehr/core' {
 *   interface FHIRPathEvaluatorExtensions {
 *     evaluateWithCache(expr: string, input: any): Promise<any>;
 *   }
 * }
 * ```
 */
export type FHIRPathEvaluatorExtensions<
  Schema extends ResourceSchema = DefaultSchema,
> = {};

export interface FHIRPathEvaluatorBase<
  Schema extends ResourceSchema = DefaultSchema,
> extends AtomicService {
  /**
   * Evaluate a FHIRPath expression
   */
  evaluate<T extends ResourceTypeOf<Schema>>(opts: {
    expression: string;
    input: ResourceOf<Schema, T>;
    context?: Record<string, any>;
  }): Promise<any>;

  /**
   * Compile a FHIRPath expression
   */
  compile(opts: { expression: string }): Promise<CompiledExpression>;

  /**
   * Analyze a FHIRPath expression
   */
  analyze(opts: { expression: string }): Promise<ExpressionAnalysis>;

  // Users can extend via declaration merging
}

export interface FHIRPathEvaluator<
  Schema extends ResourceSchema = DefaultSchema,
> extends FHIRPathEvaluatorBase<Schema>,
    FHIRPathEvaluatorExtensions<Schema> {}

// ============= CANONICAL MANAGER =============

/**
 * Canonical manager service interface
 * Manages canonical resources (profiles, value sets, etc.)
 *
 * @template Schema - Resource schema
 *
 * @example
 * ```ts
 * // Extend with custom methods:
 * declare module '@atomic-ehr/core' {
 *   interface CanonicalManagerExtensions {
 *     resolveWithCache(url: string): Promise<Canonical>;
 *   }
 * }
 * ```
 */
export type CanonicalManagerExtensions<
  Schema extends ResourceSchema = DefaultSchema,
> = {};

export interface CanonicalManagerBase<
  Schema extends ResourceSchema = DefaultSchema,
> extends AtomicService {
  /**
   * Resolve a canonical URL to a resource
   */
  resolve(canonical: string): Promise<Canonical>;

  /**
   * Search for canonical resources
   */
  search(query: string): Promise<Canonical[]>;

  // Users can extend via declaration merging
}

export interface CanonicalManager<Schema extends ResourceSchema = DefaultSchema>
  extends CanonicalManagerBase<Schema>,
    CanonicalManagerExtensions<Schema> {}

// ============= REPOSITORY =============

/**
 * Resource repository service interface
 * Provides CRUD operations for FHIR resources
 *
 * @template Schema - Resource schema for type-safe operations
 *
 * @example
 * ```ts
 * // Extend with custom methods:
 * declare module '@atomic-ehr/core' {
 *   interface ResourceRepositoryExtensions {
 *     bulkImport<T>(resources: T[]): Promise<BulkResult>;
 *     export<T>(opts: ExportOpts): AsyncIterable<T>;
 *   }
 * }
 * ```
 */
export type ResourceRepositoryExtensions<
  Schema extends ResourceSchema = DefaultSchema,
> = {};

export interface ResourceRepositoryBase<
  Schema extends ResourceSchema = DefaultSchema,
> extends AtomicService {
  /**
   * Create a new resource
   */
  create<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    resource: ResourceOf<Schema, T>;
  }): Promise<ResourceOf<Schema, T>>;

  /**
   * Read a resource by ID
   */
  read<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    id: string;
  }): Promise<ResourceOf<Schema, T>>;

  /**
   * Update a resource
   */
  update<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    id: string;
    resource: ResourceOf<Schema, T>;
  }): Promise<ResourceOf<Schema, T>>;

  /**
   * Delete a resource
   */
  delete<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    id: string;
  }): Promise<void>;

  /**
   * Search for resources
   */
  search<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    query: SearchParamsOf<Schema, T>;
  }): Promise<Array<ResourceOf<Schema, T>>>;

  /**
   * Patch a resource (partial update)
   */
  patch<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    id: string;
    patch: Partial<ResourceOf<Schema, T>>;
  }): Promise<ResourceOf<Schema, T>>;

  /**
   * Get resource history
   */
  history<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
    id: string;
  }): Promise<Array<ResourceOf<Schema, T>>>;

  /**
   * Get type-level history
   */
  typeHistory<T extends ResourceTypeOf<Schema>>(opts: {
    resourceType: T;
  }): Promise<Array<ResourceOf<Schema, T>>>;

  /**
   * Resolve a reference to a resource
   */
  resolve<T extends ResourceTypeOf<Schema>>(
    reference: string,
  ): Promise<ResourceOf<Schema, T>>;

  /**
   * Bulk resolve references
   */
  bulkResolve<T extends ResourceTypeOf<Schema>>(
    references: string[],
  ): Promise<Array<ResourceOf<Schema, T>>>;

  // Users can extend via declaration merging
}

export interface ResourceRepository<
  Schema extends ResourceSchema = DefaultSchema,
> extends ResourceRepositoryBase<Schema>,
    ResourceRepositoryExtensions<Schema> {}

// ============= AUDIT =============

/**
 * Audit event interface
 */
export interface AuditEvent {
  action: string;
  resource?: any;
  timestamp: number;
  user?: string;
  [key: string]: any;
}

/**
 * Audit service interface
 * Provides audit logging capabilities
 *
 * @template Schema - Resource schema
 *
 * @example
 * ```ts
 * // Extend with custom methods:
 * declare module '@atomic-ehr/core' {
 *   interface AuditExtensions {
 *     auditBatch(events: AuditEvent[]): Promise<void>;
 *   }
 * }
 * ```
 */
export type AuditExtensions<Schema extends ResourceSchema = DefaultSchema> = {};

export interface AuditBase<Schema extends ResourceSchema = DefaultSchema>
  extends AtomicService {
  /**
   * Log an audit event
   */
  audit(event: AuditEvent): Promise<void>;

  // Users can extend via declaration merging
}

export interface Audit<Schema extends ResourceSchema = DefaultSchema>
  extends AuditBase<Schema>,
    AuditExtensions<Schema> {}

// ============= LOGGER =============

/**
 * Log entry interface
 */
export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: any;
  timestamp?: number;
}

/**
 * Logger service interface
 * Provides logging capabilities
 *
 * @example
 * ```ts
 * // Extend with custom methods:
 * declare module '@atomic-ehr/core' {
 *   interface LoggerExtensions {
 *     logStructured(data: object): Promise<void>;
 *   }
 * }
 * ```
 */
export type LoggerExtensions = {};

export interface LoggerBase extends AtomicService {
  /**
   * Log a message
   */
  log(opts: LogEntry): Promise<void>;

  // Users can extend via declaration merging
}

export interface Logger extends LoggerBase, LoggerExtensions {}

// ============= ATOMIC SERVICES REGISTRY =============

/**
 * Base services map available in the Atomic context
 */
export interface AtomicServicesBase<
  Schema extends ResourceSchema = DefaultSchema,
> {
  audit: Audit<Schema>;
  logger: Logger;
  fhirpath: FHIRPathEvaluator<Schema>;
  validator: Validator<Schema>;
  canonicals: CanonicalManager<Schema>;
  terminology: Terminology<Schema>;
  repository: ResourceRepository<Schema>;
}

/**
 * Extension point for adding custom services via declaration merging
 *
 * @example
 * ```ts
 * declare module '@atomic-ehr/core' {
 *   interface AtomicServicesExtensions<MySchema> {
 *     analytics: AnalyticsService;
 *   }
 * }
 * ```
 */
export type AtomicServicesExtensions<
  Schema extends ResourceSchema = DefaultSchema,
> = {};

/**
 * Combined services interface exposed by Atomic context
 */
export interface AtomicServices<Schema extends ResourceSchema = DefaultSchema>
  extends AtomicServicesBase<Schema>,
    AtomicServicesExtensions<Schema> {}

// ============= ATOMIC CONTEXT =============

/**
 * Atomic context interface
 * The main context that brings all services together
 *
 * @template Schema - Resource schema for type-safe operations
 *
 * @example
 * ```ts
 * // Extend with custom properties:
 * declare module '@atomic-ehr/core' {
 *   interface AtomicContextExtensions<MySchema> {
 *     tenant: { id: string; name: string };
 *     user?: User;
 *     requestId: string;
 *   }
 * }
 * ```
 */
export type AtomicContextExtensions<
  Schema extends ResourceSchema = DefaultSchema,
> = {};

export interface AtomicContextBase<
  Schema extends ResourceSchema = DefaultSchema,
> extends AtomicServices<Schema> {}

export interface AtomicContext<Schema extends ResourceSchema = DefaultSchema>
  extends AtomicContextBase<Schema>,
    AtomicContextExtensions<Schema> {}

// ============= PLUGIN HELPERS =============

/**
 * Atomic plugin signature
 */
export type AtomicPlugin<
  Schema extends ResourceSchema = DefaultSchema,
  Result extends AtomicContext<Schema> = AtomicContext<Schema>,
> = (context: AtomicContext<Schema>) => Result | Promise<Result>;

/**
 * Helper to create typed Atomic plugins
 */
export function createAtomicPlugin<
  Schema extends ResourceSchema = DefaultSchema,
  Result extends AtomicContext<Schema> = AtomicContext<Schema>,
>(plugin: AtomicPlugin<Schema, Result>): AtomicPlugin<Schema, Result> {
  return plugin;
}

// ============= ATOMIC SYSTEM FACTORY =============

/**
 * Atomic system factory function
 * Initializes all services in dependency order
 *
 * @template Schema - Resource schema for type-safe operations
 *
 * @param config - Configuration with all required services
 * @returns Initialized context
 *
 * @example
 * ```ts
 * const context = await AtomicSystem({
 *   validator: new MyValidator(),
 *   repository: new MyRepository(),
 *   // ... other services
 * });
 * ```
 */
export async function AtomicSystem<
  Schema extends ResourceSchema = DefaultSchema,
>(config: AtomicContext<Schema>): Promise<AtomicContext<Schema>> {
  // TODO: Implement topological sort by dependencies
  for (const service of Object.values(config)) {
    if (service && typeof service === "object" && "init" in service) {
      await (service as AtomicService).init();
    }
  }
  return config;
}

// Hook system exports
export * from "./hooks/index.js";

// Plugin system exports
export * from "./plugins/index.js";
