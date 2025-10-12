/**
 * FHIR R4 preset schema for @atomic-ehr/core.
 * Provides out-of-the-box resource typings and search parameter definitions
 * for commonly used R4 resources. This preset is intentionally scoped to the
 * resources most frequently used in clinical workflows. Developers can augment
 * or replace any definitions via declaration merging or custom schemas.
 */

import type { DefineResource, DefineSchema } from "../helpers.js";

/**
 * Shared primitive and complex data type definitions for FHIR R4.
 * These are simplified but retain the core structure and enumerations from the
 * specification to give strong IDE guidance without shipping the full spec.
 */
export namespace FhirR4 {
  export type id = string;
  export type code = string;
  export type uri = string;
  export type canonical = string;
  export type markdown = string;
  export type date = string;
  export type dateTime = string;
  export type instant = string;
  export type time = string;
  export type unsignedInt = number;
  export type positiveInt = number;
  export type decimal = number;
  export type integer = number;

  export interface Element {
    id?: id;
    extension?: Extension[];
  }

  export interface Extension extends Element {
    url: uri;
    valueBoolean?: boolean;
    valueInteger?: number;
    valueDecimal?: decimal;
    valueDate?: date;
    valueDateTime?: dateTime;
    valueTime?: time;
    valueString?: string;
    valueUri?: uri;
    valueCode?: code;
    valueCoding?: Coding;
    valueCodeableConcept?: CodeableConcept;
    valueQuantity?: Quantity;
    valueReference?: Reference;
    valuePeriod?: Period;
    valueRatio?: Ratio;
    valueIdentifier?: Identifier;
    valueAttachment?: Attachment;
    valueCanonical?: canonical;
    valueMarkdown?: markdown;
  }

  export interface Narrative extends Element {
    status: "generated" | "extensions" | "additional" | "empty";
    div: string;
  }

  export interface Meta extends Element {
    versionId?: id;
    lastUpdated?: instant;
    source?: uri;
    profile?: canonical[];
    security?: Coding[];
    tag?: Coding[];
  }

  export interface Resource extends Element {
    resourceType: string;
    id?: id;
    meta?: Meta;
    implicitRules?: uri;
    language?: code;
  }

  export interface DomainResource extends Resource {
    text?: Narrative;
    contained?: Resource[];
    extension?: Extension[];
    modifierExtension?: Extension[];
  }

  export interface Coding extends Element {
    system?: uri;
    version?: string;
    code?: code;
    display?: string;
    userSelected?: boolean;
  }

  export interface CodeableConcept extends Element {
    coding?: Coding[];
    text?: string;
  }

  export interface Identifier extends Element {
    use?: "usual" | "official" | "temp" | "secondary" | "old";
    type?: CodeableConcept;
    system?: uri;
    value?: string;
    period?: Period;
    assigner?: Reference;
  }

  export interface HumanName extends Element {
    use?:
      | "usual"
      | "official"
      | "temp"
      | "nickname"
      | "anonymous"
      | "old"
      | "maiden";
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
    period?: Period;
  }

  export interface ContactPoint extends Element {
    system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
    value?: string;
    use?: "home" | "work" | "temp" | "old" | "mobile";
    rank?: positiveInt;
    period?: Period;
  }

  export interface Address extends Element {
    use?: "home" | "work" | "temp" | "old" | "billing";
    type?: "postal" | "physical" | "both";
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: Period;
  }

  export interface Attachment extends Element {
    contentType?: code;
    language?: code;
    data?: string;
    url?: uri;
    size?: unsignedInt;
    hash?: string;
    title?: string;
    creation?: dateTime;
  }

  export interface Reference extends Element {
    reference?: string;
    type?: uri;
    identifier?: Identifier;
    display?: string;
  }

  export interface Period extends Element {
    start?: dateTime;
    end?: dateTime;
  }

  export interface Quantity extends Element {
    value?: decimal;
    comparator?: "<" | "<=" | ">=" | ">";
    unit?: string;
    system?: uri;
    code?: code;
  }

  export interface Range extends Element {
    low?: Quantity;
    high?: Quantity;
  }

  export interface Ratio extends Element {
    numerator?: Quantity;
    denominator?: Quantity;
  }

  export interface SampledData extends Element {
    origin: Quantity;
    period: decimal;
    factor?: decimal;
    lowerLimit?: decimal;
    upperLimit?: decimal;
    dimensions: positiveInt;
    data: string;
  }

  export interface Timing extends Element {
    event?: dateTime[];
    repeat?: TimingRepeat;
    code?: CodeableConcept;
  }

  export interface TimingRepeat extends Element {
    boundsDuration?: Quantity;
    boundsRange?: Range;
    boundsPeriod?: Period;
    count?: positiveInt;
    countMax?: positiveInt;
    duration?: decimal;
    durationMax?: decimal;
    durationUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
    frequency?: positiveInt;
    frequencyMax?: positiveInt;
    period?: decimal;
    periodMax?: decimal;
    periodUnit?: "s" | "min" | "h" | "d" | "wk" | "mo" | "a";
    dayOfWeek?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
    timeOfDay?: time[];
    when?: (
      | "MORN"
      | "AFT"
      | "EVE"
      | "NIGHT"
      | "PHS"
      | "HS"
      | "WAKE"
      | "C"
      | "CD"
      | "CM"
      | "CV"
      | "AC"
      | "ACM"
      | "ACD"
      | "ACV"
      | "PC"
      | "PCM"
      | "PCD"
      | "PCV"
    )[];
    offset?: unsignedInt;
  }

  export interface Annotation extends Element {
    authorReference?: Reference;
    authorString?: string;
    time?: dateTime;
    text: string;
  }

  // ============= RESOURCE DEFINITIONS =============

  export interface Patient extends DomainResource {
    resourceType: "Patient";
    identifier?: Identifier[];
    active?: boolean;
    name?: HumanName[];
    telecom?: ContactPoint[];
    gender?: "male" | "female" | "other" | "unknown";
    birthDate?: date;
    deceasedBoolean?: boolean;
    deceasedDateTime?: dateTime;
    address?: Address[];
    maritalStatus?: CodeableConcept;
    multipleBirthBoolean?: boolean;
    multipleBirthInteger?: integer;
    photo?: Attachment[];
    contact?: PatientContact[];
    communication?: PatientCommunication[];
    generalPractitioner?: Reference[];
    managingOrganization?: Reference;
    link?: PatientLink[];
  }

  export interface PatientContact extends Element {
    relationship?: CodeableConcept[];
    name?: HumanName;
    telecom?: ContactPoint[];
    address?: Address;
    gender?: "male" | "female" | "other" | "unknown";
    organization?: Reference;
    period?: Period;
  }

  export interface PatientCommunication extends Element {
    language: CodeableConcept;
    preferred?: boolean;
  }

  export interface PatientLink extends Element {
    other: Reference;
    type: "replaced-by" | "replaces" | "refer" | "seealso";
  }

  export interface Practitioner extends DomainResource {
    resourceType: "Practitioner";
    identifier?: Identifier[];
    active?: boolean;
    name?: HumanName[];
    telecom?: ContactPoint[];
    address?: Address[];
    gender?: "male" | "female" | "other" | "unknown";
    birthDate?: date;
    photo?: Attachment[];
    qualification?: PractitionerQualification[];
    communication?: CodeableConcept[];
  }

  export interface PractitionerQualification extends Element {
    identifier?: Identifier[];
    code: CodeableConcept;
    period?: Period;
    issuer?: Reference;
  }

  export interface Organization extends DomainResource {
    resourceType: "Organization";
    identifier?: Identifier[];
    active?: boolean;
    type?: CodeableConcept[];
    name?: string;
    alias?: string[];
    telecom?: ContactPoint[];
    address?: Address[];
    partOf?: Reference;
    contact?: OrganizationContact[];
  }

  export interface OrganizationContact extends Element {
    purpose?: CodeableConcept;
    name?: HumanName;
    telecom?: ContactPoint[];
    address?: Address;
  }

  export interface Encounter extends DomainResource {
    resourceType: "Encounter";
    identifier?: Identifier[];
    status:
      | "planned"
      | "arrived"
      | "triaged"
      | "in-progress"
      | "onleave"
      | "finished"
      | "cancelled"
      | "entered-in-error"
      | "unknown";
    class: Coding;
    subject?: Reference;
    episodeOfCare?: Reference[];
    basedOn?: Reference[];
    participant?: EncounterParticipant[];
    period?: Period;
    length?: Quantity;
    reasonCode?: CodeableConcept[];
    diagnosis?: EncounterDiagnosis[];
    location?: EncounterLocation[];
    serviceProvider?: Reference;
    partOf?: Reference;
  }

  export interface EncounterParticipant extends Element {
    type?: CodeableConcept[];
    period?: Period;
    individual?: Reference;
  }

  export interface EncounterDiagnosis extends Element {
    condition: Reference;
    use?: CodeableConcept;
    rank?: positiveInt;
  }

  export interface EncounterLocation extends Element {
    location: Reference;
    status?: "planned" | "active" | "reserved" | "completed";
    physicalType?: CodeableConcept;
    period?: Period;
  }

  export interface Observation extends DomainResource {
    resourceType: "Observation";
    identifier?: Identifier[];
    basedOn?: Reference[];
    partOf?: Reference[];
    status:
      | "registered"
      | "preliminary"
      | "final"
      | "amended"
      | "corrected"
      | "cancelled"
      | "entered-in-error"
      | "unknown";
    category?: CodeableConcept[];
    code: CodeableConcept;
    subject?: Reference;
    focus?: Reference[];
    encounter?: Reference;
    effectiveDateTime?: dateTime;
    effectivePeriod?: Period;
    effectiveTiming?: Timing;
    effectiveInstant?: instant;
    issued?: instant;
    performer?: Reference[];
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: integer;
    valueRange?: Range;
    valueRatio?: Ratio;
    valueSampledData?: SampledData;
    valueTime?: time;
    valueDateTime?: dateTime;
    valuePeriod?: Period;
    dataAbsentReason?: CodeableConcept;
    interpretation?: CodeableConcept[];
    note?: Annotation[];
    bodySite?: CodeableConcept;
    method?: CodeableConcept;
    specimen?: Reference;
    device?: Reference;
    referenceRange?: ObservationReferenceRange[];
    hasMember?: Reference[];
    derivedFrom?: Reference[];
    component?: ObservationComponent[];
  }

  export interface ObservationReferenceRange extends Element {
    low?: Quantity;
    high?: Quantity;
    type?: CodeableConcept;
    appliesTo?: CodeableConcept[];
    age?: Range;
    text?: string;
  }

  export interface ObservationComponent extends Element {
    code: CodeableConcept;
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: integer;
    valueRange?: Range;
    valueRatio?: Ratio;
    valueSampledData?: SampledData;
    valueTime?: time;
    valueDateTime?: dateTime;
    valuePeriod?: Period;
    dataAbsentReason?: CodeableConcept;
    interpretation?: CodeableConcept[];
    referenceRange?: ObservationReferenceRange[];
  }

  export interface Condition extends DomainResource {
    resourceType: "Condition";
    identifier?: Identifier[];
    clinicalStatus?: CodeableConcept;
    verificationStatus?: CodeableConcept;
    category?: CodeableConcept[];
    severity?: CodeableConcept;
    code?: CodeableConcept;
    bodySite?: CodeableConcept[];
    subject: Reference;
    encounter?: Reference;
    onsetDateTime?: dateTime;
    onsetAge?: Quantity;
    onsetPeriod?: Period;
    onsetRange?: Range;
    onsetString?: string;
    abatementDateTime?: dateTime;
    abatementAge?: Quantity;
    abatementPeriod?: Period;
    abatementRange?: Range;
    abatementString?: string;
    recordedDate?: dateTime;
    recorder?: Reference;
    asserter?: Reference;
    stage?: ConditionStage[];
    evidence?: ConditionEvidence[];
    note?: Annotation[];
  }

  export interface ConditionStage extends Element {
    summary?: CodeableConcept;
    assessment?: Reference[];
    type?: CodeableConcept;
  }

  export interface ConditionEvidence extends Element {
    code?: CodeableConcept[];
    detail?: Reference[];
  }

  export interface Medication extends DomainResource {
    resourceType: "Medication";
    identifier?: Identifier[];
    code?: CodeableConcept;
    status?: "active" | "inactive" | "entered-in-error";
    manufacturer?: Reference;
    form?: CodeableConcept;
    amount?: Ratio;
    ingredient?: MedicationIngredient[];
    batch?: MedicationBatch;
  }

  export interface MedicationIngredient extends Element {
    itemCodeableConcept?: CodeableConcept;
    itemReference?: Reference;
    isActive?: boolean;
    strength?: Ratio;
  }

  export interface MedicationBatch extends Element {
    lotNumber?: string;
    expirationDate?: dateTime;
  }

  export interface Procedure extends DomainResource {
    resourceType: "Procedure";
    identifier?: Identifier[];
    instantiatesCanonical?: canonical[];
    instantiatesUri?: uri[];
    basedOn?: Reference[];
    partOf?: Reference[];
    status:
      | "preparation"
      | "in-progress"
      | "not-done"
      | "on-hold"
      | "stopped"
      | "completed"
      | "entered-in-error"
      | "unknown";
    statusReason?: CodeableConcept;
    category?: CodeableConcept;
    code?: CodeableConcept;
    subject: Reference;
    encounter?: Reference;
    performedDateTime?: dateTime;
    performedPeriod?: Period;
    performedString?: string;
    performedAge?: Quantity;
    performer?: ProcedurePerformer[];
    recorder?: Reference;
    asserter?: Reference;
    bodySite?: CodeableConcept[];
    outcome?: CodeableConcept;
    report?: Reference[];
    complication?: CodeableConcept[];
    complicationDetail?: Reference[];
    followUp?: CodeableConcept[];
    note?: Annotation[];
    focalDevice?: ProcedureFocalDevice[];
    usedReference?: Reference[];
    usedCode?: CodeableConcept[];
  }

  export interface ProcedurePerformer extends Element {
    function?: CodeableConcept;
    actor: Reference;
    onBehalfOf?: Reference;
  }

  export interface ProcedureFocalDevice extends Element {
    action?: CodeableConcept;
    manipulated: Reference;
  }

  export interface AllergyIntolerance extends DomainResource {
    resourceType: "AllergyIntolerance";
    identifier?: Identifier[];
    clinicalStatus?: CodeableConcept;
    verificationStatus?: CodeableConcept;
    type?: "allergy" | "intolerance";
    category?: ("food" | "medication" | "environment" | "biologic")[];
    criticality?: "low" | "high" | "unable-to-assess";
    code?: CodeableConcept;
    patient: Reference;
    onsetDateTime?: dateTime;
    onsetAge?: Quantity;
    onsetPeriod?: Period;
    onsetRange?: Range;
    recordedDate?: dateTime;
    recorder?: Reference;
    asserter?: Reference;
    lastOccurrence?: dateTime;
    note?: Annotation[];
    reaction?: AllergyIntoleranceReaction[];
  }

  export interface AllergyIntoleranceReaction extends Element {
    substance?: CodeableConcept;
    manifestation: CodeableConcept[];
    description?: string;
    onset?: dateTime;
    severity?: "mild" | "moderate" | "severe";
    exposureRoute?: CodeableConcept;
    note?: Annotation[];
  }

  export interface Appointment extends DomainResource {
    resourceType: "Appointment";
    identifier?: Identifier[];
    status:
      | "proposed"
      | "pending"
      | "booked"
      | "arrived"
      | "fulfilled"
      | "cancelled"
      | "noshow"
      | "entered-in-error"
      | "checked-in"
      | "waitlist";
    cancelationReason?: CodeableConcept;
    serviceCategory?: CodeableConcept[];
    serviceType?: CodeableConcept[];
    specialty?: CodeableConcept[];
    appointmentType?: CodeableConcept;
    reasonCode?: CodeableConcept[];
    reasonReference?: Reference[];
    priority?: unsignedInt;
    description?: string;
    start?: instant;
    end?: instant;
    length?: positiveInt;
    slot?: Reference[];
    account?: Reference[];
    created?: dateTime;
    comment?: string;
    patientInstruction?: string;
    basedOn?: Reference[];
    participant: AppointmentParticipant[];
    requestedPeriod?: Period[];
  }

  export interface AppointmentParticipant extends Element {
    type?: CodeableConcept[];
    actor?: Reference;
    required?: "required" | "optional" | "information-only";
    status: "accepted" | "declined" | "tentative" | "needs-action";
    period?: Period;
  }
}

// ============= SEARCH PARAM TYPES =============

type StringLike = string | string[];
type TokenLike = string | string[];
type DateLike = string | { from?: string; to?: string };

export interface PatientSearchParams {
  identifier?: TokenLike;
  active?: boolean;
  name?: StringLike;
  given?: StringLike;
  family?: StringLike;
  gender?: "male" | "female" | "other" | "unknown";
  birthdate?: DateLike;
  email?: StringLike;
  phone?: StringLike;
  address?: StringLike;
  organization?: StringLike;
}

export interface PractitionerSearchParams {
  identifier?: TokenLike;
  active?: boolean;
  name?: StringLike;
  given?: StringLike;
  family?: StringLike;
  telecom?: StringLike;
  organization?: StringLike;
  specialty?: StringLike;
}

export interface OrganizationSearchParams {
  identifier?: TokenLike;
  active?: boolean;
  name?: StringLike;
  address?: StringLike;
  type?: StringLike;
  partof?: StringLike;
}

export interface EncounterSearchParams {
  identifier?: TokenLike;
  patient?: StringLike;
  subject?: StringLike;
  class?: TokenLike;
  status?: TokenLike;
  date?: DateLike;
  participant?: StringLike;
  type?: StringLike;
  serviceProvider?: StringLike;
}

export interface ObservationSearchParams {
  identifier?: TokenLike;
  status?: TokenLike;
  code?: TokenLike;
  category?: TokenLike;
  patient?: StringLike;
  subject?: StringLike;
  encounter?: StringLike;
  date?: DateLike;
  performer?: StringLike;
  valueQuantity?: {
    value: number;
    unit?: string;
    system?: string;
    code?: string;
    comparator?: "<" | "<=" | ">=" | ">";
  };
}

export interface ConditionSearchParams {
  identifier?: TokenLike;
  patient?: StringLike;
  subject?: StringLike;
  category?: TokenLike;
  code?: TokenLike;
  severity?: TokenLike;
  clinicalStatus?: TokenLike;
  onset?: DateLike;
  recordedDate?: DateLike;
  encounter?: StringLike;
}

export interface MedicationSearchParams {
  code?: TokenLike;
  ingredient?: TokenLike;
  status?: TokenLike;
  manufacturer?: StringLike;
}

export interface ProcedureSearchParams {
  patient?: StringLike;
  subject?: StringLike;
  date?: DateLike;
  code?: TokenLike;
  status?: TokenLike;
  encounter?: StringLike;
  performer?: StringLike;
}

export interface AllergyIntoleranceSearchParams {
  patient?: StringLike;
  clinicalStatus?: TokenLike;
  verificationStatus?: TokenLike;
  code?: TokenLike;
  type?: TokenLike;
  category?: TokenLike;
  onset?: DateLike;
}

export interface AppointmentSearchParams {
  identifier?: TokenLike;
  status?: TokenLike;
  patient?: StringLike;
  practitioner?: StringLike;
  location?: StringLike;
  date?: DateLike;
  participantType?: TokenLike;
}

// ============= PRESET SCHEMA =============

export type FhirR4ResourceMap = {
  Patient: DefineResource<FhirR4.Patient, PatientSearchParams>;
  Practitioner: DefineResource<FhirR4.Practitioner, PractitionerSearchParams>;
  Organization: DefineResource<FhirR4.Organization, OrganizationSearchParams>;
  Encounter: DefineResource<FhirR4.Encounter, EncounterSearchParams>;
  Observation: DefineResource<FhirR4.Observation, ObservationSearchParams>;
  Condition: DefineResource<FhirR4.Condition, ConditionSearchParams>;
  Medication: DefineResource<FhirR4.Medication, MedicationSearchParams>;
  Procedure: DefineResource<FhirR4.Procedure, ProcedureSearchParams>;
  AllergyIntolerance: DefineResource<
    FhirR4.AllergyIntolerance,
    AllergyIntoleranceSearchParams
  >;
  Appointment: DefineResource<FhirR4.Appointment, AppointmentSearchParams>;
};

/**
 * Ready-to-use FHIR R4 schema covering core clinical resources.
 * Consumers can use this as-is, augment it with additional resources, or
 * declare module extensions to refine the resource/search parameter typings.
 */
export type FhirR4Schema = DefineSchema<FhirR4ResourceMap>;

/**
 * Utility type that exposes all resource types included in the preset.
 */
export type FhirR4ResourceType = keyof FhirR4ResourceMap;
