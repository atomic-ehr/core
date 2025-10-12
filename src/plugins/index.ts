/**
 * Plugin system exports for @atomic-ehr/core
 * Provides plugin registration, decorators, and encapsulation
 */

// Plugin types
export * from "./types.js";

// Decorator system
export * from "./decorator.js";

// Plugin registry
export { PluginRegistry, defaultPluginRegistry } from "./registry.js";

// Plugin scoping
export * from "./scope.js";
