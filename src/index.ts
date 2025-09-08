import type { SearchQuery } from '@atomic-ehr/fhir-search';

export interface Resource {
    id?: string;
    resourceType?: string;
    resourceDefinition?: string;
}

export interface Canonical extends Resource {
    url: string;
    version: string;
}

export interface AtomicService {
    dependencies: string[];
    capabilities: string[];
    init(context?: Partial<AtomicContext>): Promise<void>;
    destroy(): Promise<void>;
}

export interface SearchParameter {
  // Required fields
  url: string;
  name: string;
  code: string;
  base: string[];
  type: string;
  expression: string;

  // Optional commonly-used fields
  version?: string;
  target?: string[];
  multipleOr?: boolean;
  multipleAnd?: boolean;
  comparator?: Array<'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le' | 'sa' | 'eb' | 'ap'>;
  modifier?: Array<'missing' | 'exact' | 'contains' | 'not' | 'text' |
                   'in' | 'not-in' | 'below' | 'above' | 'type' | 'identifier' | 'ofType'>;

  // Open for all other FHIR SearchParameter fields
  [key: string]: any;
}

export interface CanonicalManager extends AtomicService {
    resolve(canonical: string): Promise<Canonical>;
    search(query: string): Promise<Canonical[]>;
    getSearchParametersForResource(resourceType: string): Promise<SearchParameter[]>;
}

export interface ResourceRepository extends AtomicService {
    create(opts: { resourceType: string; resource: Resource; }): Promise<Resource>;
    read(opts: { resourceType: string; id: string; }): Promise<Resource>;
    update(opts: { resourceType: string; id: string; resource: Resource; }): Promise<Resource>;
    delete(opts: { resourceType: string; id: string; }): Promise<void>;
    search(searchQuery: SearchQuery): Promise<Resource[]>;
    patch(opts: { resourceType: string; id: string; resource: Resource; }): Promise<Resource>;
    history(opts: { resourceType: string; id: string; }): Promise<Resource[]>;
    typeHistory(opts: { resourceType: string; }): Promise<Resource[]>;

    resolve(reference: string): Promise<Resource>;
    bulkResolve(references: string[]): Promise<Resource[]>;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface Validator extends AtomicService {
    validate(opts: any): ValidationResult;
    validateResource(opts: any): ValidationResult;
}

export interface Terminology extends AtomicService {
    lookup(opts: { code: string; system: string; }): Promise<any>;
    expand(opts: { system: string; }): Promise<any>;
    validateCode(opts: { code: string; system: string; }): Promise<any>;
}

export interface FHIRPath extends AtomicService {
    evaluate(opts: any): Promise<any>;
    compile(opts: any): Promise<any>;
    analyze(opts: any): Promise<any>;
}


export interface Audit extends AtomicService {
    audit(event: Resource): Promise<void>;
}

export interface Logger extends AtomicService {
    log(opts: any): Promise<void>;
}

// FHIR OperationDefinition for API routing
export interface OperationDefinition extends Resource {
  resourceType: 'OperationDefinition';
  name: string;
  code: string;
  system?: boolean;
  type?: boolean;
  instance?: boolean;
  resource?: string[];
}

export interface FHIROperation {
    operationDefinition: OperationDefinition;
    handler: (request: Request) => Promise<Response>;
}

export interface APIGateway extends AtomicService {
    registerOperation(operation: FHIROperation): void;
}

export interface AtomicContext {
    audit: Audit;
    logger: Logger;
    fhirpath: FHIRPath;
    validator: Validator;
    canonicalManager: CanonicalManager;
    terminology: Terminology;
    repository: ResourceRepository;
    apiGateway: APIGateway;
}

export async function AtomicSystem(config: Partial<AtomicContext>): Promise<Partial<AtomicContext>> {
    // todo - topological sort by dependencies
    for (const service of Object.values(config)) {
        await service.init(config);
    }
    return config;
}
