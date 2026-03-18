"use strict";
/**
 * Dynamic import example
 *
 * This file demonstrates how to use dynamic imports in TypeScript to load modules at runtime.
 * It includes a function to load a plugin from a specified path and handle errors gracefully.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
/**
 * Load a plugin dynamically from a given path
 * @param pluginPath - The file path to the plugin module
 * @returns The loaded plugin instance
 */
async function loadPlugin(pluginPath) {
    try {
        // Use dynamic import to load the plugin module
        const module = await Promise.resolve(`${pluginPath}`).then(s => __importStar(require(s)));
        // Check if the module has a default export that is a Plugin
        if (module && typeof module.default === 'object' && 'initialize' in module.default) {
            return module.default;
        }
        else {
            throw new Error(`Module at ${pluginPath} does not export a valid Plugin`);
        }
    }
    catch (error) {
        // Handle errors during dynamic import
        if (error instanceof Error) {
            console.error(`Failed to load plugin from ${pluginPath}: ${error.message}`);
        }
        else {
            console.error(`An unknown error occurred while loading plugin from ${pluginPath}`);
        }
        throw error; // Re-throw after logging
    }
}
// Example usage
(async () => {
    const pluginPath = path_1.default.resolve(__dirname, 'plugins', 'examplePlugin');
    try {
        const plugin = await loadPlugin(pluginPath);
        console.log(`Successfully loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
        // Initialize the plugin (assuming we have a context to pass)
        // await plugin.initialize(context);
    }
    catch (error) {
        console.error('Error loading plugin:', error);
    }
})();
//# sourceMappingURL=dynamic_import.js.map