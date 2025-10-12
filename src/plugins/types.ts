/**
 * Plugin system type definitions for @atomic-ehr/core
 * Inspired by Fastify's plugin architecture with encapsulation
 */

import type { AtomicContext, ResourceSchema } from "../index.js";

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Unique plugin name */
  name: string;

  /** Plugin version */
  version?: string;

  /** Plugin description */
  description?: string;

  /** Plugin dependencies (other plugin names) */
  dependencies?: string[];

  /** Plugin author */
  author?: string;

  /** Plugin tags for categorization */
  tags?: string[];
}

/**
 * Plugin options that can be passed during registration
 */
export interface PluginOptions {
  /** Custom prefix for routes registered by this plugin */
  prefix?: string;

  /** Whether to encapsulate this plugin (default: true) */
  encapsulate?: boolean;

  /** Plugin-specific configuration */
  config?: Record<string, unknown>;

  /** Metadata about the plugin */
  metadata?: Partial<PluginMetadata>;
}

/**
 * Plugin function signature
 * Receives the current context and options, can modify and return it
 *
 * @template Schema - Resource schema for type-safe operations
 * @template Options - Plugin-specific options type
 */
export type PluginFunction<
  Schema extends ResourceSchema = any,
  Options extends PluginOptions = PluginOptions
> = (
  context: AtomicContext<Schema>,
  options?: Options
) => Promise<void> | void;

/**
 * Plugin definition with metadata
 */
export interface Plugin<
  Schema extends ResourceSchema = any,
  Options extends PluginOptions = PluginOptions
> {
  /** Plugin metadata */
  metadata: PluginMetadata;

  /** Plugin registration function */
  plugin: PluginFunction<Schema, Options>;

  /** Default options for this plugin */
  defaultOptions?: Partial<Options>;
}

/**
 * Plugin registration context
 * Tracks plugin hierarchy and encapsulation
 */
export interface PluginRegistrationContext {
  /** Parent plugin (if this is a child plugin) */
  parent?: PluginRegistrationContext;

  /** Plugin metadata */
  metadata: PluginMetadata;

  /** Plugin options used during registration */
  options: PluginOptions;

  /** Child plugins registered within this plugin's scope */
  children: PluginRegistrationContext[];

  /** Decorators added by this plugin */
  decorators: Set<string>;

  /** Hooks added by this plugin */
  hooks: Set<string>;

  /** Registration timestamp */
  registeredAt: number;
}

/**
 * Plugin registry interface
 * Manages plugin lifecycle and dependencies
 */
export interface PluginRegistry {
  /** Register a plugin */
  register<Schema extends ResourceSchema = any>(
    plugin: Plugin<Schema> | PluginFunction<Schema>,
    options?: PluginOptions
  ): Promise<void>;

  /** Get registered plugin by name */
  get(name: string): PluginRegistrationContext | undefined;

  /** Check if plugin is registered */
  has(name: string): boolean;

  /** Get all registered plugins */
  all(): PluginRegistrationContext[];

  /** Get plugin dependency tree */
  getDependencyTree(name: string): PluginRegistrationContext[];

  /** Validate plugin dependencies */
  validateDependencies(): void;

  /** Get plugin hierarchy */
  getHierarchy(): PluginRegistrationContext[];
}

/**
 * Plugin error types
 */
export class PluginError extends Error {
  public pluginName?: string;
  public originalError?: Error;

  constructor(message: string, pluginName?: string, originalError?: Error) {
    super(message);
    this.name = "PluginError";
    this.pluginName = pluginName;
    this.originalError = originalError;
  }
}

export class PluginDependencyError extends PluginError {
  public readonly missingDependencies: string[];

  constructor(pluginName: string, missingDependencies: string[]) {
    super(
      `Plugin '${pluginName}' has missing dependencies: ${missingDependencies.join(", ")}`,
      pluginName
    );
    this.name = "PluginDependencyError";
    this.missingDependencies = missingDependencies;
  }
}

export class PluginAlreadyRegisteredError extends PluginError {
  constructor(pluginName: string) {
    super(`Plugin '${pluginName}' is already registered`, pluginName);
    this.name = "PluginAlreadyRegisteredError";
  }
}

/**
 * Helper to create a plugin definition
 * Provides type safety and metadata
 */
export function definePlugin<
  Schema extends ResourceSchema = any,
  Options extends PluginOptions = PluginOptions
>(
  metadata: PluginMetadata,
  plugin: PluginFunction<Schema, Options>,
  defaultOptions?: Partial<Options>
): Plugin<Schema, Options> {
  return {
    metadata,
    plugin,
    defaultOptions,
  };
}

/**
 * Helper to create a plugin function without metadata
 * Metadata will be auto-generated or inferred
 */
export function createPlugin<
  Schema extends ResourceSchema = any,
  Options extends PluginOptions = PluginOptions
>(
  plugin: PluginFunction<Schema, Options>
): PluginFunction<Schema, Options> {
  return plugin;
}
