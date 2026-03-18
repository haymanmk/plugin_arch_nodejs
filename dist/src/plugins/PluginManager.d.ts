/**
 * Plugin Manager
 *
 * Manages the complete plugin lifecycle:
 * 1. Discovery - Scan plugin directories
 * 2. Loading - Dynamic import of plugin modules
 * 3. Dependency Resolution - Topological sort with cycle detection
 * 4. Initialization - Call initialize() in dependency order
 * 5. Runtime Management - Enable/disable plugins
 * 6. Shutdown - Cleanup and call shutdown() hooks
 */
import { Plugin } from '../types/plugin';
import { Logger } from '../core/Logger';
import { Config } from '../core/Config';
import { ServiceContainer } from '../core/ServiceContainer';
import { HookRegistry } from '../hooks/HookRegistry';
import { MessageBus } from '../bus/MessageBus';
import { Command } from 'commander';
/**
 * Manages plugin discovery, loading, and lifecycle
 */
export declare class PluginManager {
    private plugins;
    private pluginDirs;
    private logger;
    private config;
    private services;
    private hooks;
    private bus;
    private program;
    constructor(pluginDirs: string[], logger: Logger, config: Config, services: ServiceContainer, hooks: HookRegistry, bus: MessageBus, program: Command);
    /**
     * Discover all plugins in the plugin directories
     * Looks for directories containing an index.js or index.ts file
     *
     * @returns Array of plugin directory paths
     */
    discoverPlugins(): Promise<string[]>;
    /**
     * Load a plugin from a directory
     * Uses dynamic import to load the module
     *
     * @param pluginPath - Path to the plugin directory
     * @returns Loaded plugin instance
     */
    loadPlugin(pluginPath: string): Promise<Plugin>;
    /**
     * Resolve plugin dependency order using topological sort
     * Detects circular dependencies
     *
     * @param plugins - Map of plugin name to plugin instance
     * @returns Ordered array of plugin names
     * @throws Error if circular dependency detected
     */
    resolveDependencyOrder(plugins: Map<string, Plugin>): string[];
    /**
     * Initialize all plugins in dependency order
     * Creates plugin context and calls initialize()
     */
    initializeAll(): Promise<void>;
    /**
     * Get a plugin by name
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * Check if a plugin is enabled
     */
    isEnabled(name: string): boolean;
    /**
     * Enable a plugin
     */
    enable(name: string): void;
    /**
     * Disable a plugin
     */
    disable(name: string): void;
    /**
     * Get all plugin names
     */
    getPluginNames(): string[];
    /**
     * Get all enabled plugin names
     */
    getEnabledPluginNames(): string[];
    /**
     * Shutdown all plugins
     * Calls shutdown() hook on each plugin if defined
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=PluginManager.d.ts.map