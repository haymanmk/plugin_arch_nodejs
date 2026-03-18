"use strict";
/**
 * Plugin Type Definitions
 *
 * Defines the contract for plugins in the architecture:
 * - PluginMetadata: Declarative info about the plugin
 * - PluginContext: Runtime services available to plugins
 * - Plugin: The interface every plugin must implement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlugin = isPlugin;
/**
 * Type guard to check if an object is a valid Plugin
 */
function isPlugin(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    const plugin = obj;
    return (typeof plugin.metadata === 'object' &&
        plugin.metadata !== null &&
        typeof plugin.metadata.name === 'string' &&
        typeof plugin.metadata.version === 'string' &&
        typeof plugin.initialize === 'function');
}
//# sourceMappingURL=plugin.js.map