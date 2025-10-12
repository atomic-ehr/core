# Extension Pattern Guide

This guide shows how to extend @atomic-ehr/core services using Fastify-style declaration merging.

## Overview

@atomic-ehr/core provides a flexible type system that allows you to:
- Define custom resource schemas
- Start from the built-in FHIR R4 preset and extend only what you need
- Add custom methods to services
- Add custom properties to context
- Get full TypeScript autocomplete

## Step 1: Create Type Definitions

Create a `types/atomic.d.ts` file in your project. Start by extending the
shipped `FhirR4ResourceMap`, then layer any custom resources or overrides you
need:

```typescript
// types/atomic.d.ts
import type {
  AtomicService,
  DefineResource,
  ValidationResult,
  FhirR4ResourceMap,
  FhirR4Schema
} from '@atomic-ehr/core';

declare module '@atomic-ehr/core' {
  // Start from the built-in FHIR R4 resources and add a custom domain object
  interface ResourceSchema extends FhirR4ResourceMap {
    AnalyticsEvent: DefineResource<
      {
        resourceType: 'AnalyticsEvent';
        id?: string;
        timestamp: string;
        type: string;
        actor?: string;
        context?: Record<string, unknown>;
      },
      {
        type?: string;
        actor?: string;
        date?: { from?: string; to?: string };
      }
    >;
  }

  // Extend Validator service
  interface ValidatorExtensions {
    validateWithAI(resource: any): Promise<ValidationResult>;
    validateBusinessRules(resource: any, rules: string[]): Promise<ValidationResult>;
  }

  // Extend Terminology service
  interface TerminologyExtensions {
    lookupSNOMED(code: string): Promise<SNOMEDConcept>;
    translateCode(opts: TranslateOpts): Promise<Translation>;
  }

  // Extend Repository service
  interface ResourceRepositoryExtensions {
    bulkImport<T>(resources: T[]): Promise<BulkResult>;
    export<T>(opts: ExportOpts): AsyncIterable<T>;
  }

  // Register additional services
  interface AtomicServicesExtensions {
    analytics: AnalyticsService;
  }

  // Extend Context
  interface AtomicContextExtensions {
    tenant: { id: string; name: string };
    user?: { id: string; role: string };
    requestId: string;
  }
}

// Define supporting types
interface SNOMEDConcept {
  code: string;
  display: string;
  fsn: string;
}

interface TranslateOpts {
  code: string;
  sourceSystem: string;
  targetSystem: string;
}

interface Translation {
  sourceCode: string;
  targetCode: string;
  equivalence: string;
}

interface AnalyticsService extends AtomicService {
  dependencies: string[];
  capabilities: string[];
  track(event: string, payload?: Record<string, unknown>): Promise<void>;
}

interface BulkResult {
  total: number;
  succeeded: number;
  failed: number;
}

interface ExportOpts {
  resourceType: string;
  filters?: Record<string, any>;
}
```

## Step 2: Implement Extended Services

```typescript
// services/MyValidator.ts
import { Validator, ValidationResult } from '@atomic-ehr/core';

export class MyValidator implements Validator<FhirR4Schema> {
  dependencies = [];
  capabilities = ['validate'];

  async init() {}
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
    // Call AI service
    const aiResult = await callAIService(resource);
    return {
      valid: aiResult.isValid,
      errors: aiResult.issues
    };
  }

  async validateBusinessRules(resource: any, rules: string[]): Promise<ValidationResult> {
    const errors = [];
    for (const rule of rules) {
      if (!this.checkRule(resource, rule)) {
        errors.push(`Rule ${rule} failed`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  private checkRule(resource: any, rule: string): boolean {
    // Rule implementation
    return true;
  }
}
```

```typescript
// services/MyTerminology.ts
import { Terminology } from '@atomic-ehr/core';

export class MyTerminology implements Terminology<FhirR4Schema> {
  dependencies = [];
  capabilities = ['terminology'];

  async init() {}
  async destroy() {}

  // Core methods
  async lookup() {
    return { code: 'test', display: 'Test' };
  }

  async expand() {
    return { contains: [] };
  }

  async validateCode() {
    return { result: true };
  }

  // Extended methods (custom)
  async lookupSNOMED(code: string) {
    const response = await fetch(`https://snomed-api/concepts/${code}`);
    return response.json();
  }

  async translateCode(opts: TranslateOpts) {
    // Implement code translation logic
    return {
      sourceCode: opts.code,
      targetCode: 'translated-code',
      targetSystem: opts.targetSystem,
      equivalence: 'equivalent'
    };
  }
}

```typescript
// services/MyAnalyticsService.ts
export class MyAnalyticsService implements AnalyticsService {
  dependencies = [];
  capabilities = ['analytics'];

  async init() {}
  async destroy() {}

  async track(event: string, payload?: Record<string, unknown>) {
    console.log('analytics event', event, payload);
  }
}
```
```

## Step 3: Initialize System with Extensions

```typescript
// app.ts
import { AtomicSystem } from '@atomic-ehr/core';
import { MyValidator } from './services/MyValidator';
import { MyTerminology } from './services/MyTerminology';
import { MyAnalyticsService } from './services/MyAnalyticsService';
// ... other imports

const context = await AtomicSystem<FhirR4Schema>({
  validator: new MyValidator(),
  terminology: new MyTerminology(),
  repository: new MyRepository(),
  analytics: new MyAnalyticsService(),
  // ... other services

  // ✅ Custom context properties (from declaration merging)
  tenant: { id: 'tenant-1', name: 'Hospital A' },
  requestId: 'req-123',
  user: { id: 'user-1', role: 'practitioner' }
});

// ✅ Type-safe resource operations
const patient = await context.repository.create({
  resourceType: "Patient", // ✅ Autocomplete: "Patient" | "Observation"
  resource: {
    resourceType: "Patient",
    name: [{ family: "Doe", given: ["John"] }],
    gender: "male" // ✅ Autocomplete: "male" | "female" | "other" | "unknown"
  }
}); // ✅ Returns typed Patient resource

// ✅ Use extended methods
const aiValidation = await context.validator.validateWithAI(patient);
const snomedConcept = await context.terminology.lookupSNOMED("386661006");
const bulkResult = await context.repository.bulkImport([patient]);
await context.analytics.track('patients.imported', { count: 1 });

// ✅ Access custom context properties
console.log(context.tenant.name); // ✅ Typed!
console.log(context.user?.role); // ✅ Typed!
```

## Step 4: Package Extensions as Plugins

```typescript
// plugins/analytics.ts
import { createAtomicPlugin } from '@atomic-ehr/core';

export const analyticsPlugin = createAtomicPlugin(async (context) => {
  await context.analytics.track('analytics-plugin:loaded');
  return context;
});
```

## Key Benefits

1. **Type Safety**: Full TypeScript support with autocomplete
2. **FHIR Agnostic**: Works with R4, R5, or custom resources
3. **Extensible**: Add custom methods to any service
4. **Fastify Pattern**: Familiar declaration merging approach
5. **No Runtime Magic**: Pure TypeScript, no decorators or reflection
6. **Backward Compatible**: Existing code continues to work

## With Real FHIR Types

To use actual FHIR R4/R5 types, install the type definitions:

```bash
bun add -d @types/fhir
```

Then in your `types/atomic.d.ts`:

```typescript
import type { R4 } from '@types/fhir';
import type { DefineResource, FhirR4ResourceMap } from '@atomic-ehr/core';

declare module '@atomic-ehr/core' {
  interface ResourceSchema extends FhirR4ResourceMap {
    Patient: DefineResource<
      R4.IPatient,
      {
        name?: string;
        birthdate?: string;
        // ... other FHIR search parameters
      }
    >;

    Observation: DefineResource<
      R4.IObservation,
      {
        patient?: string;
        code?: string;
        // ...
      }
    >;
  }
}
```

Now you get full FHIR R4 type safety with autocomplete for all fields!

## Multi-Tenant Example

```typescript
// types/atomic.d.ts
declare module '@atomic-ehr/core' {
  interface AtomicContextExtensions {
    tenant: {
      id: string;
      name: string;
      settings: {
        features: string[];
        limits: {
          maxPatients: number;
          maxProviders: number;
        };
      };
    };

    user: {
      id: string;
      tenantId: string;
      role: 'admin' | 'practitioner' | 'patient';
      permissions: string[];
    };
  }
}

// app.ts
const context = await AtomicSystem({
  // ... services

  tenant: {
    id: 'hospital-a',
    name: 'Hospital A',
    settings: {
      features: ['ai-validation', 'bulk-import'],
      limits: {
        maxPatients: 10000,
        maxProviders: 500
      }
    }
  },

  user: {
    id: 'user-123',
    tenantId: 'hospital-a',
    role: 'practitioner',
    permissions: ['read:Patient', 'write:Patient', 'read:Observation']
  }
});

// ✅ All properties are typed!
if (context.tenant.settings.features.includes('ai-validation')) {
  await context.validator.validateWithAI(resource);
}

if (context.user.role === 'admin') {
  // Admin-only operations
}
```

## Testing with Extended Types

```typescript
import { test, expect } from 'bun:test';
import { AtomicSystem } from '@atomic-ehr/core';
import { MyValidator } from './services/MyValidator';

test('custom validator methods work', async () => {
  const context = await AtomicSystem({
    validator: new MyValidator(),
    // ... other services
  });

  const patient = {
    resourceType: 'Patient',
    name: [{ family: 'Doe' }]
  };

  // ✅ Extended methods are available
  const result = await context.validator.validateWithAI(patient);
  expect(result.valid).toBe(true);

  const rulesResult = await context.validator.validateBusinessRules(patient, ['has-name']);
  expect(rulesResult.valid).toBe(true);
});
```

## Summary

The extension pattern allows you to:
- Start with a simple, untyped implementation
- Gradually add type safety as needed
- Extend services with custom methods
- Add context properties for your use case
- Get full IDE support with autocomplete

All while maintaining backward compatibility and following familiar TypeScript patterns (Fastify-style declaration merging).
