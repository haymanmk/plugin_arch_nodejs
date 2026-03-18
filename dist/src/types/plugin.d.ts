/**
 * Plugin Type Definitions
 *
 * Defines the contract for plugins in the architecture:
 * - PluginMetadata: Declarative info about the plugin
 * - PluginContext: Runtime services available to plugins
 * - Plugin: The interface every plugin must implement
 */
import { Command } from 'commander';
import { Logger } from '../core/Logger';
import { Config } from '../core/Config';
import { ServiceContainer } from '../core/ServiceContainer';
import { HookRegistry } from '../hooks/HookRegistry';
import { MessageBus } from '../bus/MessageBus';
/**
 * Plugin metadata - declarative configuration
 * Each plugin exports this to describe itself
 */
export interface PluginMetadata {
    /** Unique plugin identifier (e.g., 'base-formatter') */
    name: string;
    /** Semantic version */
    version: string;
    /** Human-readable description */
    description: string;
    /** Other plugins this one depends on (loaded first) */
    dependencies?: string[];
    /** JSON schema for plugin-specific config (optional) */
    configSchema?: Record<string, unknown>;
}
/**
 * Plugin context - runtime services injected into plugins
 * This is the API surface plugins use to interact with the core
 */
export interface PluginContext {
    /** Namespaced logger (automatically prefixed with plugin name) */
    logger: Logger;
    /** Configuration store (namespaced to plugin) */
    config: Config;
    /** Dependency injection container for shared services */
    services: ServiceContainer;
    /** Hook system for filter chains and broadcasts */
    hooks: HookRegistry;
    /** Message bus for inter-plugin pub/sub */
    bus: MessageBus;
    /** CLI root command (for registering subcommands) */
    program: Command;
}
/**
 * Plugin interface - what every plugin must implement
 * Lifecycle: initialize() called after all dependencies are loaded
 */
export interface Plugin {
    /** Metadata exported by the plugin */
    metadata: PluginMetadata;
    /**
     * Initialize the plugin with runtime context
     * Called once after dependency resolution
     *
     * @param context - Injected runtime services
     */
    initialize(context: PluginContext): Promise<void> | void;
    /**
     * Cleanup function called during shutdown (optional)
     * Use for closing connections, flushing buffers, etc.
     */
    shutdown?(): Promise<void> | void;
}
/**
 * Type guard to check if an object is a valid Plugin
 */
export declare function isPlugin(obj: unknown): obj is Plugin;
//# sourceMappingURL=plugin.d.ts.map