/**
 * FHIR R4 Server with Type Extensions
 * Demonstrates Fastify-style declaration merging for:
 * - Resource schema definition
 * - Custom validator methods
 * - Custom terminology methods
 * - Custom context properties
 *
 * NOTE: This file is for demonstration purposes only.
 * In real usage, the declaration merging would be in a separate .d.ts file
 * (see examples/types/fhir.d.ts for the proper structure).
 *
 * TypeScript doesn't support declaration merging within the same file,
 * so this example is excluded from typecheck but shows the concept.
 *
 * For a working example, see examples/01-basic-usage.ts
 * For the extension pattern guide, see examples/03-extension-pattern.md
 */

// First, define your types using declaration merging
// In a real project, this would be in a separate types/fhir.d.ts file

declare module "@atomic-ehr/core" {
  // ===== INCLUDE BUILT-IN FHIR R4 RESOURCES =====
  interface ResourceSchema extends FhirR4ResourceMap {}

  // ===== EXTEND VALIDATOR SERVICE =====
  interface ValidatorExtensions {
    // Add AI-powered validation
    validateWithAI(resource: any): Promise<ValidationResult>;

    // Add business rule validation
    validateBusinessRules(
      resource: any,
      rules: string[],
    ): Promise<ValidationResult>;
  }

  // ===== EXTEND TERMINOLOGY SERVICE =====
  interface TerminologyExtensions {
    // Add SNOMED lookup
    lookupSNOMED(code: string): Promise<{
      code: string;
      display: string;
      fsn: string;
    }>;

    // Add code translation
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

  // ===== EXTEND REPOSITORY SERVICE =====
  interface ResourceRepositoryExtensions {
    // Add bulk import
    bulkImport<T>(resources: T[]): Promise<{
      total: number;
      succeeded: number;
      failed: number;
    }>;
  }

  // ===== EXTEND CONTEXT =====
  interface AtomicContextExtensions {
    // Multi-tenancy
    tenant: {
      id: string;
      name: string;
    };

    // Request ID for tracing
    requestId: string;

    // User context
    user?: {
      id: string;
      role: string;
      permissions: string[];
    };
  }
}

// Now implement the extended services
import {
  type AtomicContext,
  AtomicSystem,
  type Audit,
  type CanonicalManager,
  type FHIRPathEvaluator,
  type FhirR4ResourceMap,
  type FhirR4Schema,
  type Logger,
  type ResourceRepository,
  type Terminology,
  type ValidationResult,
  type Validator,
} from "../src/index.js";

// Extended Validator implementation
class MyValidator implements Validator<FhirR4Schema> {
  dependencies = [];
  capabilities = ["validate"];

  async init() {
    console.log("✅ Enhanced Validator initialized");
  }

  async destroy() {}

  // Core methods (required)
  validate() {
    return { valid: true, errors: [] };
  }

  validateResource() {
    return { valid: true, errors: [] };
  }

  // Extended methods (custom)
  async validateWithAI(resource: any): Promise<ValidationResult> {
    console.log("🤖 Running AI validation...");
    // Mock AI validation
    return {
      valid: true,
      errors: [],
    };
  }

  async validateBusinessRules(
    resource: any,
    rules: string[],
  ): Promise<ValidationResult> {
    console.log(`📋 Validating ${rules.length} business rules...`);
    // Mock business rules
    return {
      valid: true,
      errors: [],
    };
  }
}

// Extended Terminology implementation
class MyTerminology implements Terminology<FhirR4Schema> {
  dependencies = [];
  capabilities = ["terminology"];

  async init() {
    console.log("✅ Enhanced Terminology initialized");
  }

  async destroy() {}

  // Core methods
  async lookup() {
    return { code: "test", display: "Test" };
  }

  async expand() {
    return { contains: [] };
  }

  async validateCode() {
    return { result: true };
  }

  // Extended methods (custom)
  async lookupSNOMED(code: string) {
    console.log(`🔍 Looking up SNOMED code: ${code}`);
    return {
      code: code,
      display: "Fever",
      fsn: "Fever (finding)",
    };
  }

  async translateCode(opts: {
    code: string;
    sourceSystem: string;
    targetSystem: string;
  }) {
    console.log(
      `🔄 Translating ${opts.code} from ${opts.sourceSystem} to ${opts.targetSystem}`,
    );
    return {
      sourceCode: opts.code,
      targetCode: "8310-5",
      equivalence: "equivalent",
    };
  }
}

// Extended Repository implementation
class MyRepository implements ResourceRepository<FhirR4Schema> {
  dependencies = [];
  capabilities = ["repository"];

  async init() {
    console.log("✅ Enhanced Repository initialized");
  }

  async destroy() {}

  // Core methods
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

  // Extended method (custom)
  async bulkImport<T>(resources: T[]) {
    console.log(`📦 Bulk importing ${resources.length} resources...`);
    return {
      total: resources.length,
      succeeded: resources.length,
      failed: 0,
    };
  }
}

// Simple implementations for other services
class SimpleFHIRPath implements FHIRPathEvaluator<FhirR4Schema> {
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

class SimpleCanonicalManager implements CanonicalManager<FhirR4Schema> {
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

class SimpleAudit implements Audit<FhirR4Schema> {
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

// Initialize the system with extended services and custom context
console.log("🚀 Initializing type-safe FHIR R4 server...\n");

const context: AtomicContext<FhirR4Schema> = await AtomicSystem<FhirR4Schema>({
  validator: new MyValidator(),
  repository: new MyRepository(),
  terminology: new MyTerminology(),
  fhirpath: new SimpleFHIRPath(),
  canonicals: new SimpleCanonicalManager(),
  audit: new SimpleAudit(),
  logger: new SimpleLogger(),

  // ✅ Custom context properties (from declaration merging)
  tenant: {
    id: "tenant-1",
    name: "Hospital A",
  },
  requestId: "req-123",
  user: {
    id: "user-1",
    role: "practitioner",
    permissions: ["read:Patient", "write:Patient"],
  },
});

console.log("\n✅ System initialized with extensions!");
console.log("📊 Tenant:", context.tenant.name);
console.log("👤 User:", context.user?.role);
console.log("🆔 Request ID:", context.requestId);

// ===== DEMONSTRATE TYPE-SAFE OPERATIONS =====

console.log("\n📝 Creating a Patient resource...");

// ✅ Type-safe resource creation
// In VS Code/IDE, you get autocomplete for:
// - resourceType: "Patient" | "Observation"
// - resource fields based on Patient schema
const patient = await context.repository.create({
  resourceType: "Patient", // ✅ Autocomplete!
  resource: {
    resourceType: "Patient",
    name: [{ family: "Doe", given: ["John"] }],
    gender: "male", // ✅ Autocomplete: "male" | "female" | "other" | "unknown"
    birthDate: "1990-01-01",
    telecom: [{ system: "email", value: "john@example.com" }],
  },
});

console.log("✅ Created patient:", patient.id);

// ===== USE EXTENDED METHODS =====

console.log("\n🔧 Using extended validator methods...");

// ✅ Custom AI validation
const aiValidation = await context.validator.validateWithAI(patient);
console.log("AI validation:", aiValidation.valid ? "PASS" : "FAIL");

// ✅ Custom business rules validation
const rulesValidation = await context.validator.validateBusinessRules(patient, [
  "has-family-name",
  "has-birthdate",
  "adult-has-contact",
]);
console.log("Business rules:", rulesValidation.valid ? "PASS" : "FAIL");

console.log("\n🔧 Using extended terminology methods...");

// ✅ Custom SNOMED lookup
const snomedConcept = await context.terminology.lookupSNOMED("386661006");
console.log("SNOMED concept:", snomedConcept.display);

// ✅ Custom code translation
const translation = await context.terminology.translateCode({
  code: "386661006",
  sourceSystem: "http://snomed.info/sct",
  targetSystem: "http://loinc.org",
});
console.log("Translated to:", translation.targetCode);

console.log("\n🔧 Using extended repository methods...");

// ✅ Custom bulk import
const bulkResult = await context.repository.bulkImport([patient]);
console.log(
  `Bulk import: ${bulkResult.succeeded}/${bulkResult.total} succeeded`,
);

console.log("\n🎉 Type-safe FHIR R4 server demonstration complete!");
console.log("\n💡 Key features demonstrated:");
console.log("  • Type-safe resource operations with autocomplete");
console.log("  • Custom validator methods (validateWithAI)");
console.log("  • Custom terminology methods (lookupSNOMED, translateCode)");
console.log("  • Custom repository methods (bulkImport)");
console.log("  • Custom context properties (tenant, user, requestId)");
console.log("  • Fastify-style declaration merging");
console.log("  • FHIR version agnostic (works with R4, R5, or custom)");
