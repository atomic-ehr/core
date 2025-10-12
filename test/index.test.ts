import type {
  Audit,
  AuditEvent,
  CanonicalManager,
  FHIRPathEvaluator,
  Logger,
  ResourceRepository,
  Terminology,
  Validator,
} from "../src";
import { AtomicSystem } from "../src";

function TestFHIRPath(): FHIRPathEvaluator {
  return {
    dependencies: [],
    capabilities: [],
    evaluate: async (opts: any) => {
      return { result: "male" };
    },
    compile: async (opts: any) => {
      return { expression: opts.expression, compiled: {} };
    },
    analyze: async (opts: any) => {
      return { expression: opts.expression, valid: true };
    },
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
  };
}

function TestCanonicalManager(): CanonicalManager {
  return {
    dependencies: [],
    capabilities: [],
    resolve: async (canonical: string) => {
      return { url: "http://example.com", version: "1.0.0" };
    },
    search: async (query: string) => {
      return [{ url: "http://example.com", version: "1.0.0" }];
    },
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
  };
}

function TestValidator(): Validator {
  return {
    dependencies: [],
    capabilities: [],
    validate: (opts: any) => {
      return { valid: true, errors: [] };
    },
    validateResource: (opts: any) => {
      return { valid: true, errors: [] };
    },
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
  };
}

// Removed TestAPI function as API type doesn't exist

function TestTerminology(): Terminology {
  return {
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
    dependencies: [],
    capabilities: [],
    lookup: async (opts: any) => {
      return { code: "male", display: "Male" };
    },
    expand: async (opts: any) => {
      return {
        contains: [{ system: "system", code: "male", display: "Male" }],
      };
    },
    validateCode: async (opts: any) => {
      return { result: true, display: "Male" };
    },
  };
}

function TestRepository(config: { dir: string }): ResourceRepository {
  return {
    create: async (opts: any) => {
      return { id: "123" };
    },
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
    dependencies: [],
    capabilities: [],
    read: async (opts: any) => {
      return { id: "123" };
    },
    update: async (opts: any) => {
      return { id: "123" };
    },
    delete: async (opts: any) => {},
    search: async (opts: any) => {
      return [{ id: "123" }];
    },
    patch: async (opts: any) => {
      return { id: "123" };
    },
    history: async (opts: any) => {
      return [{ id: "123" }];
    },
    typeHistory: async (opts: any) => {
      return [{ id: "123" }];
    },
    resolve: async (reference: string) => {
      return { id: "123" };
    },
    bulkResolve: async (references: string[]) => {
      return [{ id: "123" }];
    },
  };
}

function TestAudit(): Audit {
  return {
    audit: async (event: AuditEvent) => {
      return;
    },
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
    dependencies: [],
    capabilities: [],
  };
}
function TestLogger(): Logger {
  return {
    log: async (opts: any) => {
      return;
    },
    init: async () => {
      return;
    },
    destroy: async () => {
      return;
    },
    dependencies: [],
    capabilities: [],
  };
}

const system = await AtomicSystem({
  canonicals: TestCanonicalManager(),
  fhirpath: TestFHIRPath(),
  terminology: TestTerminology(),
  validator: TestValidator(),
  repository: TestRepository({ dir: "./test/data" }),
  audit: TestAudit(),
  logger: TestLogger(),
});

console.log(system);

const patient = await system.repository.read({
  resourceType: "Patient",
  id: "123",
});

system.validator.validateResource(patient);

system.fhirpath.evaluate({ expression: "Patient.name", input: patient });
