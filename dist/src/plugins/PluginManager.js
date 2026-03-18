"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const plugin_1 = require("../types/plugin");
/**
 * Manages plugin discovery, loading, and lifecycle
 */
class PluginManager {
    constructor(pluginDirs, logger, config, services, hooks, bus, program) {
        this.plugins = new Map();
        this.pluginDirs = pluginDirs;
        this.logger = logger;
        this.config = config;
        this.services = services;
        this.hooks = hooks;
        this.bus = bus;
        this.program = program;
    }
    /**
     * Discover all plugins in the plugin directories
     * Looks for directories containing an index.js or index.ts file
     *
     * @returns Array of plugin directory paths
     */
    async discoverPlugins() {
        const discovered = [];
        for (const pluginDir of this.pluginDirs) {
            if (!fs.existsSync(pluginDir)) {
                this.logger.warn(`Plugin directory not found: ${pluginDir}`);
                continue;
            }
            const entries = fs.readdirSync(pluginDir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) {
                    continue;
                }
                const pluginPath = path.join(pluginDir, entry.name);
                const indexJs = path.join(pluginPath, 'index.js');
                const indexTs = path.join(pluginPath, 'index.ts');
                if (fs.existsSync(indexJs) || fs.existsSync(indexTs)) {
                    discovered.push(pluginPath);
                    this.logger.debug(`Discovered plugin: ${entry.name}`);
                }
            }
        }
        this.logger.info(`Discovered ${discovered.length} plugins`);
        return discovered;
    }
    /**
     * Load a plugin from a directory
     * Uses dynamic import to load the module
     *
     * @param pluginPath - Path to the plugin directory
     * @returns Loaded plugin instance
     */
    async loadPlugin(pluginPath) {
        try {
            // Dynamic import (works with both .js and .ts via ts-node)
            const module = await Promise.resolve(`${pluginPath}`).then(s => __importStar(require(s)));
            // Get the default export or the module itself
            const plugin = module.default || module;
            if (!(0, plugin_1.isPlugin)(plugin)) {
                throw new Error(`Invalid plugin at ${pluginPath}: missing required properties`);
            }
            this.logger.debug(`Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
            return plugin;
        }
        catch (error) {
            this.logger.error(`Failed to load plugin from ${pluginPath}`, error);
            throw error;
        }
    }
    /**
     * Resolve plugin dependency order using topological sort
     * Detects circular dependencies
     *
     * @param plugins - Map of plugin name to plugin instance
     * @returns Ordered array of plugin names
     * @throws Error if circular dependency detected
     */
    resolveDependencyOrder(plugins) {
        const resolved = [];
        const visiting = new Set();
        const visited = new Set();
        const visit = (pluginName, path = []) => {
            // Already resolved
            if (visited.has(pluginName)) {
                return;
            }
            // Circular dependency detected
            if (visiting.has(pluginName)) {
                const cycle = [...path, pluginName].join(' -> ');
                throw new Error(`Circular dependency detected: ${cycle}`);
            }
            const plugin = plugins.get(pluginName);
            if (!plugin) {
                throw new Error(`Plugin "${pluginName}" not found (required by dependency)`);
            }
            visiting.add(pluginName);
            // Visit dependencies first
            const deps = plugin.metadata.dependencies || [];
            for (const dep of deps) {
                visit(dep, [...path, pluginName]);
            }
            visiting.delete(pluginName);
            visited.add(pluginName);
            resolved.push(pluginName);
        };
        // Visit all plugins
        for (const pluginName of plugins.keys()) {
            visit(pluginName);
        }
        return resolved;
    }
    /**
     * Initialize all plugins in dependency order
     * Creates plugin context and calls initialize()
     */
    async initializeAll() {
        // Discover plugins
        const pluginPaths = await this.discoverPlugins();
        // Load all plugins
        const loadedPlugins = new Map();
        for (const pluginPath of pluginPaths) {
            try {
                const plugin = await this.loadPlugin(pluginPath);
                loadedPlugins.set(plugin.metadata.name, plugin);
            }
            catch (error) {
                this.logger.error(`Failed to load plugin from ${pluginPath}`, error);
            }
        }
        // Resolve dependency order
        let orderedNames;
        try {
            orderedNames = this.resolveDependencyOrder(loadedPlugins);
            this.logger.info(`Plugin load order: ${orderedNames.join(', ')}`);
        }
        catch (error) {
            this.logger.error('Failed to resolve plugin dependencies', error);
            throw error;
        }
        // Initialize plugins in dependency order
        for (const pluginName of orderedNames) {
            const plugin = loadedPlugins.get(pluginName);
            try {
                // Create plugin-specific context
                const context = {
                    logger: this.logger.child(pluginName),
                    config: this.config,
                    services: this.services,
                    hooks: this.hooks,
                    bus: this.bus,
                    program: this.program
                };
                // Call initialize
                await plugin.initialize(context);
                // Store plugin state
                this.plugins.set(pluginName, {
                    plugin,
                    enabled: true,
                    initialized: true,
                    context
                });
                this.logger.info(`Initialized plugin: ${pluginName}`);
            }
            catch (error) {
                this.logger.error(`Failed to initialize plugin: ${pluginName}`, error);
            }
        }
        this.logger.success(`Loaded ${this.plugins.size} plugins`);
    }
    /**
     * Get a plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name)?.plugin;
    }
    /**
     * Check if a plugin is enabled
     */
    isEnabled(name) {
        return this.plugins.get(name)?.enabled ?? false;
    }
    /**
     * Enable a plugin
     */
    enable(name) {
        const state = this.plugins.get(name);
        if (state) {
            state.enabled = true;
            this.logger.info(`Enabled plugin: ${name}`);
        }
    }
    /**
     * Disable a plugin
     */
    disable(name) {
        const state = this.plugins.get(name);
        if (state) {
            state.enabled = false;
            this.logger.info(`Disabled plugin: ${name}`);
        }
    }
    /**
     * Get all plugin names
     */
    getPluginNames() {
        return Array.from(this.plugins.keys());
    }
    /**
     * Get all enabled plugin names
     */
    getEnabledPluginNames() {
        return this.getPluginNames().filter(name => this.isEnabled(name));
    }
    /**
     * Shutdown all plugins
     * Calls shutdown() hook on each plugin if defined
     */
    async shutdown() {
        this.logger.info('Shutting down plugins...');
        // Shutdown in reverse order (last loaded, first shutdown)
        const pluginNames = Array.from(this.plugins.keys()).reverse();
        for (const pluginName of pluginNames) {
            const state = this.plugins.get(pluginName);
            if (!state) {
                continue;
            }
            try {
                if (state.plugin.shutdown) {
                    await state.plugin.shutdown();
                    this.logger.debug(`Shutdown plugin: ${pluginName}`);
                }
            }
            catch (error) {
                this.logger.error(`Error shutting down plugin: ${pluginName}`, error);
            }
        }
        this.logger.info('All plugins shutdown');
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=PluginManager.js.map