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
interface AtomicContext {
    audit: Audit;
    logger: Logger;
    fhirpath: FHIRPath;
    validator: Validator;
    canonicals: CanonicalManager;
    terminology: Terminology;
    repository: ResourceRepository;
}
```

### AtomicSystem

Factory function to initialize the system:

```typescript
async function AtomicSystem(config: AtomicContext): Promise<AtomicContext>
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

## License

[License information here]