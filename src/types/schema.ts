/**
 * Core schema type system for @atomic-ehr/core
 * Provides Supabase-style generic schema pattern for type-safe resource operations
 */

/**
 * Base resource schema structure
 * Users define their own schema by extending this interface via declaration merging
 *
 * @example
 * ```ts
 * declare module '@atomic-ehr/core' {
 *   interface ResourceSchema extends FhirR4ResourceMap {
 *     AnalyticsEvent: DefineResource<
 *       {
 *         resourceType: 'AnalyticsEvent';
 *         timestamp: string;
 *         type: string;
 *       },
 *       { type?: string; date?: { from?: string; to?: string } }
 *     >;
 *   }
 * }
 * ```
 */
export interface ResourceSchema {
  [resourceType: string]: {
    resource: any;
    searchParams?: Record<string, any>;
    createParams?: any;
    updateParams?: any;
  };
}

/**
 * Default schema for backward compatibility
 * Uses generic types when no specific schema is provided
 */
export interface DefaultSchema extends ResourceSchema {
  [resourceType: string]: {
    resource: any;
    searchParams?: Record<string, any>;
  };
}

/**
 * Extract resource type names from schema
 *
 * @example
 * ```ts
 * type MyResourceTypes = ResourceTypeOf<MySchema>; // "Patient" | "Observation"
 * ```
 */
export type ResourceTypeOf<Schema extends ResourceSchema> = Extract<
  keyof Schema,
  string
>;

/**
 * Extract resource definition from schema
 *
 * @example
 * ```ts
 * type Patient = ResourceOf<MySchema, "Patient">; // R4.IPatient
 * ```
 */
export type ResourceOf<
  Schema extends ResourceSchema,
  T extends ResourceTypeOf<Schema>,
> = Schema[T]["resource"];

/**
 * Extract search parameters from schema
 *
 * @example
 * ```ts
 * type PatientSearchParams = SearchParamsOf<MySchema, "Patient">; // { name?: string }
 * ```
 */
export type SearchParamsOf<
  Schema extends ResourceSchema,
  T extends ResourceTypeOf<Schema>,
> = Schema[T]["searchParams"] extends Record<string, any>
  ? Schema[T]["searchParams"]
  : Record<string, any>;

/**
 * Extract create parameters from schema
 * Falls back to resource type if not specified
 */
export type CreateParamsOf<
  Schema extends ResourceSchema,
  T extends ResourceTypeOf<Schema>,
> = Schema[T]["createParams"] extends Record<string, any>
  ? Schema[T]["createParams"]
  : ResourceOf<Schema, T>;

/**
 * Extract update parameters from schema
 * Falls back to Partial<resource> if not specified
 */
export type UpdateParamsOf<
  Schema extends ResourceSchema,
  T extends ResourceTypeOf<Schema>,
> = Schema[T]["updateParams"] extends Record<string, any>
  ? Schema[T]["updateParams"]
  : Partial<ResourceOf<Schema, T>>;
