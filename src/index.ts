// Import type system
import type {
	ResourceSchema,
	DefaultSchema,
	ResourceTypeOf,
	ResourceOf,
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
 *   interface Validator {
 *     validateWithAI(resource: any): Promise<ValidationResult>;
 *   }
 * }
 * ```
 */
export interface Validator<Schema extends ResourceSchema = DefaultSchema>
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
 *   interface Terminology {
 *     lookupSNOMED(code: string): Promise<SNOMEDConcept>;
 *     translateCode(opts: TranslateOpts): Promise<Translation>;
 *   }
 * }
 * ```
 */
export interface Terminology<Schema extends ResourceSchema = DefaultSchema>
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
 *   interface FHIRPathEvaluator {
 *     evaluateWithCache(expr: string, input: any): Promise<any>;
 *   }
 * }
 * ```
 */
export interface FHIRPathEvaluator<Schema extends ResourceSchema = DefaultSchema>
	extends AtomicService {
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
 *   interface CanonicalManager {
 *     resolveWithCache(url: string): Promise<Canonical>;
 *   }
 * }
 * ```
 */
export interface CanonicalManager<Schema extends ResourceSchema = DefaultSchema>
	extends AtomicService {
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
 *   interface ResourceRepository {
 *     bulkImport<T>(resources: T[]): Promise<BulkResult>;
 *     export<T>(opts: ExportOpts): AsyncIterable<T>;
 *   }
 * }
 * ```
 */
export interface ResourceRepository<
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
 *   interface Audit {
 *     auditBatch(events: AuditEvent[]): Promise<void>;
 *   }
 * }
 * ```
 */
export interface Audit<Schema extends ResourceSchema = DefaultSchema>
	extends AtomicService {
	/**
	 * Log an audit event
	 */
	audit(event: AuditEvent): Promise<void>;

	// Users can extend via declaration merging
}

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
 *   interface Logger {
 *     logStructured(data: object): Promise<void>;
 *   }
 * }
 * ```
 */
export interface Logger extends AtomicService {
	/**
	 * Log a message
	 */
	log(opts: LogEntry): Promise<void>;

	// Users can extend via declaration merging
}

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
 *   interface AtomicContext {
 *     tenant: { id: string; name: string };
 *     user?: User;
 *     requestId: string;
 *   }
 * }
 * ```
 */
export interface AtomicContext<Schema extends ResourceSchema = DefaultSchema> {
	audit: Audit<Schema>;
	logger: Logger;
	fhirpath: FHIRPathEvaluator<Schema>;
	validator: Validator<Schema>;
	canonicals: CanonicalManager<Schema>;
	terminology: Terminology<Schema>;
	repository: ResourceRepository<Schema>;

	// Users can extend via declaration merging
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
