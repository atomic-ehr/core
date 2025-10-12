/**
 * Type helper utilities for @atomic-ehr/core
 * Provides convenient type constructors for defining schemas
 */

import type { ResourceRepository } from "../index.js";
import type { DefaultSchema, ResourceSchema } from "./schema.js";

/**
 * Helper to define a resource schema entry
 * Provides a clean API for defining resource types
 *
 * @example
 * ```ts
 * type PatientSchema = DefineResource<
 *   R4.IPatient,
 *   { name?: string; birthdate?: string }
 * >;
 * ```
 */
export type DefineResource<
  TResource,
  TSearchParams = Record<string, any>,
  TCreate = TResource,
  TUpdate = Partial<TResource>,
> = {
  resource: TResource;
  searchParams: TSearchParams;
  createParams: TCreate;
  updateParams: TUpdate;
};

/**
 * Helper to define a complete schema
 * Automatically wraps simple types in DefineResource
 *
 * @example
 * ```ts
 * type MySchema = DefineSchema<{
 *   Patient: R4.IPatient; // Automatically wrapped
 *   Observation: { resource: R4.IObservation; searchParams: {...} }; // Manual
 * }>;
 * ```
 */
export type DefineSchema<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends { resource: any } ? T[K] : DefineResource<T[K]>;
};

/**
 * Utility type for extracting schema from context
 * Useful for type inference in generic functions
 */
export type InferSchema<T> = T extends {
  repository: ResourceRepository<infer Schema>;
}
  ? Schema
  : DefaultSchema;
