# @atomic-ehr/core

Core interfaces for Atomic EHR modules.


```typescript
import { ResourceRepository } from "@atomic-ehr/core";

const context: AtomicContext = await AtomicSystem.init({
    validator: FHIRSchemaValidator(),
    canonicals: NPMFHIRCanonicalManager({packages: [hl7.fhir.r4.core]}),
    terminology: ProxyTerminology({url: "https://tx.fhir.org/r4"}),
    repo: InMemoryFHIRResourceRepository({ 
        resources: { Patient: {}, Encounter: {}, Observation: {} }
    })
})

const patient = await context.repo.create({
    resource: {
        resourceType: "Patient",
        name: [ { given: ["John"], family: ["Doe"] } ]
    }
})

context.terminology.lookup({code: "male", system: "http://hl7.org/fhir/ValueSet/administrative-gender"})

context.validator.validate({resource: patient})

context.canonicals.resolve({reference: "http://hl7.org/fhir/StructureDefinition/Patient"})

context.fhirpath.evaluate({expression: 'Patient.name', input: patient})

```