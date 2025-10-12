# @atomic-ehr/core

Core interfaces and types for building modular FHIR-based healthcare systems with Atomic EHR.

## Overview

This package provides the foundational interfaces and types for creating a modular, service-oriented FHIR implementation. It defines core contracts for various healthcare data management concerns including resource storage, validation, terminology services, and more.

## Core Interfaces

### Resource Types

- **Resource**: Base interface for all FHIR resources with optional `id`, `resourceType`, and `resourceDefinition` fields
- **Canonical**: Extends Resource with `url` and `version` fields for canonical resources

### Service Interfaces

All services extend the base `AtomicService` interface which provides:

- `dependencies`: Array of required service dependencies
- `capabilities`: Array of provided capabilities
- `init()`: Async initialization method
- `destroy()`: Async cleanup method

#### ResourceRepository

Handles CRUD operations for FHIR resources:

- `create()`, `read()`, `update()`, `delete()`
- `search()` with query support
- `patch()` for partial updates
- `history()` and `typeHistory()` for resource versioning
- `resolve()` and `bulkResolve()` for reference resolution

#### CanonicalManager

Manages canonical resources (profiles, value sets, etc.):

- `resolve()`: Resolve canonical URLs
- `search()`: Search for canonical resources

#### Validator

Resource validation services:

- `validate()`: General validation
- `validateResource()`: Resource-specific validation
- Returns `ValidationResult` with boolean `valid` flag and `errors` array

#### Terminology

FHIR terminology services:

- `lookup()`: Look up codes in code systems
- `expand()`: Expand value sets
- `validateCode()`: Validate codes against terminologies

#### FHIRPath

FHIRPath expression evaluation:

- `evaluate()`: Evaluate FHIRPath expressions
- `compile()`: Compile expressions
- `analyze()`: Analyze expressions

#### Audit & Logger

- `Audit`: Audit trail management with `audit()` method
- `Logger`: Logging services with `log()` method

### AtomicContext

The main context interface that brings all services together:

```typescript
interface AtomicContext<Schema extends ResourceSchema = DefaultSchema>
  extends AtomicServices<Schema>,
    AtomicContextExtensions<Schema> {}
```

`AtomicServices` contains the required service instances (repository, validator, etc.). Extend `AtomicServicesExtensions` or `AtomicContextExtensions` via declaration merging to add new services and context fields.

### AtomicSystem

Factory function to initialize the system:

```typescript
async function AtomicSystem<Schema extends ResourceSchema = DefaultSchema>(
  config: AtomicContext<Schema>
): Promise<AtomicContext<Schema>>
```

Initializes all services in the correct order (will support topological sorting by dependencies).

## Usage Example

```typescript
import { AtomicSystem, AtomicContext } from "@atomic-ehr/core";

// Initialize your service implementations
const context: AtomicContext = await AtomicSystem({
    audit: new MyAuditService(),
    logger: new MyLoggerService(),
    fhirpath: new MyFHIRPathService(),
    validator: new MyValidatorService(),
    canonicals: new MyCanonicalManager(),
    terminology: new MyTerminologyService(),
    repository: new MyResourceRepository()
});

// Create a patient resource
const patient = await context.repository.create({
    resourceType: "Patient",
    resource: {
        resourceType: "Patient",
        name: [{ given: ["John"], family: "Doe" }]
    }
});

// Validate the resource
const validation = context.validator.validateResource({ resource: patient });

// Look up terminology
const genderCode = await context.terminology.lookup({
    code: "male",
    system: "http://hl7.org/fhir/administrative-gender"
});

// Evaluate FHIRPath
const names = await context.fhirpath.evaluate({
    expression: "Patient.name.given",
    input: patient
});
```

## Installation

```bash
bun add @atomic-ehr/core
```

## Type System

@atomic-ehr/core includes a powerful type system that provides:

- **Generic resource schemas**: Define custom resource types for full type safety
- **Ready-made presets**: Import `FhirR4Schema` for common R4 resources without setup
- **Fastify-style extension surfaces**: Extend services and context via `*Extensions` interfaces and `AtomicServicesExtensions`
- **FHIR version agnostic**: Works with R4, R5, or custom resource types
- **Full autocomplete**: Get IntelliSense for resource types, search parameters, and more

### Quick Example

```typescript
import { AtomicSystem } from '@atomic-ehr/core';
import type {
  AtomicContext,
  FhirR4Schema,
  FhirR4ResourceMap,
  ValidationResult
} from '@atomic-ehr/core';

declare module '@atomic-ehr/core' {
  interface ResourceSchema extends FhirR4ResourceMap {}

  interface ValidatorExtensions {
    validateWithAI(resource: any): Promise<ValidationResult>;
  }

  interface AtomicServicesExtensions {
    analytics: { track: (event: string) => Promise<void> };
  }

  interface AtomicContextExtensions {
    tenant: { id: string; name: string };
    user?: { id: string; role: string };
  }
}

const context: AtomicContext<FhirR4Schema> = await AtomicSystem<FhirR4Schema>({
  /* ... services ... */
});

const patient = await context.repository.create({
  resourceType: "Patient", // ✅ Autocomplete: built-in R4 resources
  resource: {
    resourceType: "Patient",
    name: [{ family: "Doe", given: ["Jane"] }]
  }
});

await context.validator.validateWithAI(patient); // ✅ Extended method
await context.analytics.track("patient.created"); // ✅ New service

console.log(context.tenant.name); // ✅ Typed property
```

Need the canonical FHIR R4 resource models without extra setup? Import the
`FhirR4Schema` or `FhirR4ResourceMap` preset and pass it to `AtomicSystem` to get
typed `Patient`, `Observation`, `Encounter`, and other common resources out of
the box. You can still refine or extend any resource via the same declaration
merging hooks shown above.

### Plugins

Use `createAtomicPlugin` to package reusable extensions:

```typescript
import { createAtomicPlugin } from '@atomic-ehr/core';

export const requestTracing = createAtomicPlugin(async (context) => {
  context.logger.log({ level: 'debug', message: 'Tracing enabled' });
  return context;
});
```

See [examples/03-extension-pattern.md](./examples/03-extension-pattern.md) for a complete guide.

## Examples

- [01-basic-usage.ts](./examples/01-basic-usage.ts) - Basic usage without extensions
- [02-typed-fhir-r4.ts](./examples/02-typed-fhir-r4.ts) - Full FHIR R4 example with extensions
- [03-extension-pattern.md](./examples/03-extension-pattern.md) - Complete extension guide
- [Types & Extensions](./docs/types.md) - In-depth type system and preset reference

## Hook System

@atomic-ehr/core includes a powerful hook system for request lifecycle management. See [examples/hooks-demo.ts](./examples/hooks-demo.ts) for a complete example.

## License

MIT
