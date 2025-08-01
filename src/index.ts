export interface Resource {
    id?: string;
    resourceType?: string;
    resourceDefinition?: string;
}

export interface Canonical extends Resource {
    url: string;
    version: string;
}

export interface CanonicalManager {
    resolve(canonical: string): Promise<Canonical>;
    search(query: string): Promise<Canonical[]>;
}

export interface ResourceRepository {
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

export interface Validator {
    validate(opts: any): ValidationResult;
    validateResource(opts: any): ValidationResult;
}

export interface Terminology {
    lookup(opts: { code: string; system: string; }): Promise<any>;
    expand(opts: { system: string; }): Promise<any>;
    validateCode(opts: { code: string; system: string; }): Promise<any>;
}

export interface FHIRPath {
    evaluate(opts: any): Promise<any>;
    compile(opts: any): Promise<any>;
    analyze(opts: any): Promise<any>;
}

export interface AuditEvent { }

export interface AuditLog {
    audit(opts: AuditEvent): Promise<void>;
}

export interface Logger {
    log(opts: any): Promise<void>;
}

export interface AtomicContext {
    validator?: Validator;
    canonicalManager?: CanonicalManager;
    terminology?: Terminology;
    resourceRepository?: ResourceRepository;
    logger?: Logger;
    fhirpath?: FHIRPath;
}

export interface AtomicConfig {

}