---
title: Atomic Type System
description: Extending @atomic-ehr/core with Fastify-style declaration merging and built-in FHIR presets.
---

# Atomic Types & Extension Guide

This guide distills everything developers and coding agents need to work effectively with `@atomic-ehr/core`’s type system. The focus is on predictable extension points, repeatable patterns, and ready-made presets you can drop into a new project without hunting through the source.

## TL;DR for Agents

- Import `FhirR4Schema` or `FhirR4ResourceMap` for instant FHIR R4 typings.
- Extend the `*Extensions` interfaces (`ValidatorExtensions`, `AtomicServicesExtensions`, etc.) via declaration merging—never mutate the base interfaces directly.
- Always pass your schema to `AtomicSystem<Schema>()` so inference propagates.
- Prefer helpers like `DefineResource` and `DefineSchema` when authoring overrides.
- Use `createAtomicPlugin` to bundle reusable extensions and keep augmentation localized.

## Core Concepts

### Resource Schema Contract

The entire system revolves around the `ResourceSchema` interface:

```ts
export interface ResourceSchema {
  [resourceType: string]: {
    resource: any;
    searchParams?: Record<string, any>;
    createParams?: any;
    updateParams?: any;
  };
}
```

You never edit this interface directly. Instead, you extend it via module augmentation. The helpers in `src/types/helpers.ts` (`DefineResource`, `DefineSchema`, `InferSchema`) keep the ergonomics manageable—lean on them to avoid repeating boilerplate.

### Fastify-Style Extension Surface

Every major service exposes two layers:

```ts
interface ValidatorBase<Schema> extends AtomicService { /* required methods */ }
interface ValidatorExtensions<Schema> {} // empty on purpose
interface Validator<Schema> extends ValidatorBase<Schema>, ValidatorExtensions<Schema> {}
```

You augment `ValidatorExtensions` rather than the base. The same pattern holds for `AtomicServicesExtensions`, `AtomicContextExtensions`, `TerminologyExtensions`, etc. This mirrors Fastify’s plugin API and avoids the usual “mystery interface name” trap for newcomers.

### FHIR R4 Preset

Need sensible defaults? Import the preset:

```ts
import type {
  FhirR4Schema,
  FhirR4ResourceMap,
} from '@atomic-ehr/core';
```

`FhirR4ResourceMap` includes typed models and search parameters for common clinical resources (Patient, Observation, Encounter, etc.). Extend it to add more:

```ts
declare module '@atomic-ehr/core' {
  interface ResourceSchema extends FhirR4ResourceMap {
    AnalyticsEvent: DefineResource<{
      resourceType: 'AnalyticsEvent';
      timestamp: string;
      type: string;
    }>;
  }
}
```

### Example: Extending Services & Context

```ts
// types/atomic.d.ts
import type {
  AtomicService,
  AtomicContext,
  AtomicServicesExtensions,
  DefineResource,
  FhirR4Schema,
  FhirR4ResourceMap,
  ValidationResult,
} from '@atomic-ehr/core';

declare module '@atomic-ehr/core' {
  interface ResourceSchema extends FhirR4ResourceMap {
    AnalyticsEvent: DefineResource<{
      resourceType: 'AnalyticsEvent';
      id?: string;
      timestamp: string;
      type: string;
      actor?: string;
    }>;
  }

  interface ValidatorExtensions {
    validateWithAI(resource: any): Promise<ValidationResult>;
  }

  interface AtomicServicesExtensions {
    analytics: AnalyticsService;
  }

  interface AtomicContextExtensions {
    tenant: { id: string; name: string };
  }
}

interface AnalyticsService extends AtomicService {
  track(event: string): Promise<void>;
}
```

Then wire it up:

```ts
import { AtomicSystem, createAtomicPlugin } from '@atomic-ehr/core';
import type { AtomicContext, FhirR4Schema } from '@atomic-ehr/core';

export const analyticsPlugin = createAtomicPlugin(async (context) => {
  await context.analytics.track('analytics-plugin:loaded');
  return context;
});

const context: AtomicContext<FhirR4Schema> = await AtomicSystem<FhirR4Schema>({
  analytics: new MyAnalyticsService(),
  validator: new MyValidator(),
  // … other services
});
```

## Recipes

### 1. Use the FHIR R4 preset out of the box

```ts
import { AtomicSystem } from '@atomic-ehr/core';
import type { AtomicContext, FhirR4Schema } from '@atomic-ehr/core';

const context: AtomicContext<FhirR4Schema> = await AtomicSystem<FhirR4Schema>({
  validator: new MyValidator(),
  repository: new MyRepository(),
  // … other services
});

const patient = await context.repository.create({
  resourceType: 'Patient',
  resource: {
    resourceType: 'Patient',
    name: [{ family: 'Doe', given: ['Jane'] }],
  },
});
```

### 2. Add a custom resource on top of the preset

```ts
declare module '@atomic-ehr/core' {
  interface ResourceSchema extends FhirR4ResourceMap {
    CareTeamNote: DefineResource<{
      resourceType: 'CareTeamNote';
      author: string;
      body: string;
    }>;
  }
}
```

### 3. Extend a service with extra capabilities

```ts
declare module '@atomic-ehr/core' {
  interface TerminologyExtensions {
    translateTo(loinc: string): Promise<string>;
  }
}
```

Now implement `translateTo` on your terminology service class—TypeScript will enforce it.

### 4. Package reusable extensions as plugins

```ts
export const aiValidationPlugin = createAtomicPlugin(async (context) => {
  context.validator.validateWithAI ??=
    async (resource) => ({ valid: true, errors: [] });
  return context;
});
```

## Tips for Automation

- **Type inference matters**: Always parameterize `AtomicSystem` with your schema to keep inference strong (`AtomicSystem<MySchema>()`).
- **Stick to the extension interfaces**: Agents should augment `*Extensions` surfaces only; this guarantees compatibility with future releases.
- **Linting/formatting**: The project is plain TypeScript—no special generators. Run `npm run build` to validate declarations compile.
- **Preset evolution**: The bundled R4 preset covers high-traffic resources. If you extend it heavily, consider publishing your additions as a separate preset file to share across services.

## Further Reading

- [`README.md`](../README.md) – project overview and quick example.
- [`examples/03-extension-pattern.md`](../examples/03-extension-pattern.md) – end-to-end extension walkthrough.
- [`src/types/presets/fhir-r4.ts`](../src/types/presets/fhir-r4.ts) – inspect or extend the preset definitions.
