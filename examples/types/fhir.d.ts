/**
 * Type augmentation for FHIR R4 server
 * This file demonstrates Fastify-style declaration merging
 *
 * In your project, create a similar file (e.g., types/atomic.d.ts)
 * and TypeScript will automatically pick it up
 */

import type { ValidationResult } from "../../src/index.js";

declare module "@atomic-ehr/core" {
	// ===== DEFINE RESOURCE SCHEMA =====
	interface CustomSchema {
		Patient: {
			resource: {
				resourceType: "Patient";
				id?: string;
				name?: Array<{
					family?: string;
					given?: string[];
				}>;
				gender?: "male" | "female" | "other" | "unknown";
				birthDate?: string;
				telecom?: Array<{
					system?: string;
					value?: string;
				}>;
			};
			searchParams: {
				name?: string;
				family?: string;
				given?: string;
				birthdate?: string;
				gender?: "male" | "female" | "other" | "unknown";
				_id?: string;
			};
		};

		Observation: {
			resource: {
				resourceType: "Observation";
				id?: string;
				status: "registered" | "preliminary" | "final" | "amended";
				code: {
					coding?: Array<{
						system?: string;
						code?: string;
						display?: string;
					}>;
				};
				subject?: {
					reference?: string;
				};
			};
			searchParams: {
				patient?: string;
				code?: string;
				date?: string;
			};
		};
	}

	// ===== EXTEND VALIDATOR =====
	interface Validator {
		validateWithAI(resource: any): Promise<ValidationResult>;
		validateBusinessRules(
			resource: any,
			rules: string[],
		): Promise<ValidationResult>;
	}

	// ===== EXTEND TERMINOLOGY =====
	interface Terminology {
		lookupSNOMED(code: string): Promise<{
			code: string;
			display: string;
			fsn: string;
		}>;

		translateCode(opts: {
			code: string;
			sourceSystem: string;
			targetSystem: string;
		}): Promise<{
			sourceCode: string;
			targetCode: string;
			equivalence: string;
		}>;
	}

	// ===== EXTEND REPOSITORY =====
	interface ResourceRepository {
		bulkImport<T>(
			resources: T[],
		): Promise<{
			total: number;
			succeeded: number;
			failed: number;
		}>;
	}

	// ===== EXTEND CONTEXT =====
	interface AtomicContext {
		tenant: {
			id: string;
			name: string;
		};
		requestId: string;
		user?: {
			id: string;
			role: string;
			permissions: string[];
		};
	}
}
