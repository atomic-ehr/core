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
    init(): Promise<void>;
    destroy(): Promise<void>;
}

export interface CanonicalManager extends AtomicService {
    resolve(canonical: string): Promise<Canonical>;
    search(query: string): Promise<Canonical[]>;
}

export interface ResourceRepository extends AtomicService {
    create(opts: { resourceType: string; resource: Resource; }): Promise<Resource>;
    read(opts: { resourceType: string; id: string; }): Promise<Resource>;
    update(opts: { resourceType: string; id: string; resource: Resource; }): Promise<Resource>;
    delete(opts: { resourceType: string; id: string; }): Promise<void>;
    search(opts: { resourceType: string; query: string; }): Promise<Resource[]>;
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


export interface AtomicContext {
    audit: Audit;
    logger: Logger;
    fhirpath: FHIRPath;
    validator: Validator;
    canonicals: CanonicalManager;
    terminology: Terminology;
    repository: ResourceRepository;
}

export async function AtomicSystem(config: AtomicContext): Promise<AtomicContext> {
    // todo - topological sort by dependencies
    for (const service of Object.values(config)) {
        await service.init()
    }
    return config;
}