/**
 * Plugin registry implementation
 * Manages plugin lifecycle, dependencies, and encapsulation
 */

import type {
  Plugin,
  PluginFunction,
  PluginMetadata,
  PluginOptions,
  PluginRegistrationContext,
  PluginRegistry as IPluginRegistry,
} from "./types.js";
import {
  PluginAlreadyRegisteredError,
  PluginDependencyError,
  PluginError,
} from "./types.js";
import type { AtomicContext, ResourceSchema } from "../index.js";

/**
 * Plugin registry implementation
 */
export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, PluginRegistrationContext> = new Map();
  private currentParent: PluginRegistrationContext | undefined;
  private registrationOrder: string[] = [];

  /**
   * Register a plugin
   */
  async register<Schema extends ResourceSchema = any>(
    pluginOrFunction: Plugin<Schema> | PluginFunction<Schema>,
    options: PluginOptions = {}
  ): Promise<void> {
    // Extract plugin function and metadata
    let pluginFn: PluginFunction<Schema>;
    let metadata: PluginMetadata;

    if (typeof pluginOrFunction === "function") {
      // Plain function - generate metadata
      pluginFn = pluginOrFunction;
      metadata = {
        name: options.metadata?.name || pluginFn.name || `plugin-${Date.now()}`,
        version: options.metadata?.version,
        description: options.metadata?.description,
        dependencies: options.metadata?.dependencies || [],
        author: options.metadata?.author,
        tags: options.metadata?.tags || [],
      };
    } else {
      // Plugin object with metadata
      pluginFn = pluginOrFunction.plugin;
      metadata = { ...pluginOrFunction.metadata, ...options.metadata };

      // Merge default options
      if (pluginOrFunction.defaultOptions) {
        options = { ...pluginOrFunction.defaultOptions, ...options };
      }
    }

    // Check if already registered
    if (this.plugins.has(metadata.name)) {
      throw new PluginAlreadyRegisteredError(metadata.name);
    }

    // Validate dependencies
    this.validatePluginDependencies(metadata);

    // Create registration context
    const registrationContext: PluginRegistrationContext = {
      parent: this.currentParent,
      metadata,
      options: {
        encapsulate: true, // Default to encapsulation
        ...options,
      },
      children: [],
      decorators: new Set(),
      hooks: new Set(),
      registeredAt: Date.now(),
    };

    // Add to parent's children if within plugin scope
    if (this.currentParent) {
      this.currentParent.children.push(registrationContext);
    }

    // Register plugin
    this.plugins.set(metadata.name, registrationContext);
    this.registrationOrder.push(metadata.name);

    // If encapsulation is enabled, set as current parent for child plugins
    const previousParent = this.currentParent;
    if (options.encapsulate !== false) {
      this.currentParent = registrationContext;
    }

    try {
      // Execute plugin registration (plugin can register child plugins)
      // Note: We don't pass the context here yet - that will be done by the server
      // This just registers the plugin structure

    } finally {
      // Restore previous parent
      if (options.encapsulate !== false) {
        this.currentParent = previousParent;
      }
    }
  }

  /**
   * Get registered plugin by name
   */
  get(name: string): PluginRegistrationContext | undefined {
    return this.plugins.get(name);
  }

  /**
   * Check if plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all registered plugins
   */
  all(): PluginRegistrationContext[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin dependency tree
   */
  getDependencyTree(name: string): PluginRegistrationContext[] {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return [];
    }

    const tree: PluginRegistrationContext[] = [plugin];
    const dependencies = plugin.metadata.dependencies || [];

    for (const depName of dependencies) {
      const depPlugin = this.plugins.get(depName);
      if (depPlugin) {
        tree.push(...this.getDependencyTree(depName));
      }
    }

    return tree;
  }

  /**
   * Validate all plugin dependencies
   */
  validateDependencies(): void {
    for (const [name, plugin] of this.plugins.entries()) {
      this.validatePluginDependencies(plugin.metadata);
    }
  }

  /**
   * Get plugin hierarchy (tree structure)
   */
  getHierarchy(): PluginRegistrationContext[] {
    // Return only root-level plugins (those without parents)
    return Array.from(this.plugins.values()).filter(
      (plugin) => !plugin.parent
    );
  }

  /**
   * Get plugins in registration order
   */
  getRegistrationOrder(): string[] {
    return [...this.registrationOrder];
  }

  /**
   * Get plugin with its full hierarchy path
   */
  getPluginPath(name: string): string[] {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return [];
    }

    const path: string[] = [plugin.metadata.name];
    let current = plugin.parent;

    while (current) {
      path.unshift(current.metadata.name);
      current = current.parent;
    }

    return path;
  }

  /**
   * Check if a plugin is a descendant of another
   */
  isDescendantOf(pluginName: string, ancestorName: string): boolean {
    const path = this.getPluginPath(pluginName);
    return path.includes(ancestorName);
  }

  /**
   * Validate plugin dependencies
   */
  private validatePluginDependencies(metadata: PluginMetadata): void {
    const dependencies = metadata.dependencies || [];
    const missing: string[] = [];

    for (const depName of dependencies) {
      if (!this.plugins.has(depName)) {
        missing.push(depName);
      }
    }

    if (missing.length > 0) {
      throw new PluginDependencyError(metadata.name, missing);
    }

    // Check for circular dependencies
    this.checkCircularDependencies(metadata.name, new Set());
  }

  /**
   * Check for circular dependencies
   */
  private checkCircularDependencies(
    pluginName: string,
    visited: Set<string>,
    path: string[] = []
  ): void {
    if (visited.has(pluginName)) {
      throw new PluginError(
        `Circular dependency detected: ${[...path, pluginName].join(" -> ")}`,
        pluginName
      );
    }

    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return;
    }

    visited.add(pluginName);
    path.push(pluginName);

    const dependencies = plugin.metadata.dependencies || [];
    for (const depName of dependencies) {
      this.checkCircularDependencies(depName, new Set(visited), [...path]);
    }
  }

  /**
   * Clear all plugins (useful for testing)
   */
  clear(): void {
    this.plugins.clear();
    this.registrationOrder = [];
    this.currentParent = undefined;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      rootPlugins: this.getHierarchy().length,
      pluginsWithDependencies: Array.from(this.plugins.values()).filter(
        (p) => (p.metadata.dependencies?.length || 0) > 0
      ).length,
      registrationOrder: this.registrationOrder,
    };
  }
}

/**
 * Default global plugin registry
 */
export const defaultPluginRegistry = new PluginRegistry();
