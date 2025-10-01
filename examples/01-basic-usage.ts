/**
 * Basic usage example without type extensions
 * Shows backward compatibility with existing code
 */

import {
	AtomicSystem,
	type AtomicContext,
	type Validator,
	type ResourceRepository,
	type Terminology,
	type FHIRPathEvaluator,
	type CanonicalManager,
	type Audit,
	type Logger,
} from "../src/index.js";

// Simple mock implementations
class SimpleValidator implements Validator {
	dependencies = [];
	capabilities = ["validate"];

	async init() {
		console.log("Validator initialized");
	}

	async destroy() {}

	validate() {
		return { valid: true, errors: [] };
	}

	validateResource() {
		return { valid: true, errors: [] };
	}
}

class SimpleRepository implements ResourceRepository {
	dependencies = [];
	capabilities = ["repository"];

	async init() {
		console.log("Repository initialized");
	}

	async destroy() {}

	async create(opts: any) {
		return { id: "123", ...opts.resource };
	}

	async read() {
		return { id: "123" };
	}

	async update(opts: any) {
		return opts.resource;
	}

	async delete() {}

	async search() {
		return [];
	}

	async patch(opts: any) {
		return opts.patch;
	}

	async history() {
		return [];
	}

	async typeHistory() {
		return [];
	}

	async resolve() {
		return { id: "123" };
	}

	async bulkResolve() {
		return [];
	}
}

class SimpleTerminology implements Terminology {
	dependencies = [];
	capabilities = ["terminology"];

	async init() {}
	async destroy() {}

	async lookup() {
		return { code: "test", display: "Test" };
	}

	async expand() {
		return { contains: [] };
	}

	async validateCode() {
		return { result: true };
	}
}

class SimpleFHIRPath implements FHIRPathEvaluator {
	dependencies = [];
	capabilities = ["fhirpath"];

	async init() {}
	async destroy() {}

	async evaluate() {
		return [];
	}

	async compile(opts: any) {
		return { expression: opts.expression, compiled: {} };
	}

	async analyze(opts: any) {
		return { expression: opts.expression, valid: true };
	}
}

class SimpleCanonicalManager implements CanonicalManager {
	dependencies = [];
	capabilities = ["canonicals"];

	async init() {}
	async destroy() {}

	async resolve() {
		return { url: "http://example.com", version: "1.0.0" };
	}

	async search() {
		return [];
	}
}

class SimpleAudit implements Audit {
	dependencies = [];
	capabilities = ["audit"];

	async init() {}
	async destroy() {}

	async audit() {}
}

class SimpleLogger implements Logger {
	dependencies = [];
	capabilities = ["logger"];

	async init() {}
	async destroy() {}

	async log(opts: any) {
		console.log(`[${opts.level}] ${opts.message}`);
	}
}

// Initialize the system
const context = await AtomicSystem({
	validator: new SimpleValidator(),
	repository: new SimpleRepository(),
	terminology: new SimpleTerminology(),
	fhirpath: new SimpleFHIRPath(),
	canonicals: new SimpleCanonicalManager(),
	audit: new SimpleAudit(),
	logger: new SimpleLogger(),
});

console.log("✅ Atomic system initialized!");
console.log("Available services:", Object.keys(context));

// Use the system
const patient = await context.repository.create({
	resourceType: "Patient",
	resource: {
		name: [{ family: "Doe", given: ["John"] }],
	},
});

console.log("Created patient:", patient);

const validation = context.validator.validate({
	resource: patient,
});

console.log("Validation result:", validation);
