/**
 * Dynamic import example
 * 
 * This file demonstrates how to use dynamic imports in TypeScript to load modules at runtime.
 * It includes a function to load a plugin from a specified path and handle errors gracefully.
 */

import path from 'path';
import { Plugin } from './types/plugin';

/**
 * Load a plugin dynamically from a given path
 * @param pluginPath - The file path to the plugin module
 * @returns The loaded plugin instance
 */
async function loadPlugin(pluginPath: string): Promise<Plugin> {
  try {
    // Use dynamic import to load the plugin module
    const module = await import(pluginPath);
    
    // Check if the module has a default export that is a Plugin
    if (module && typeof module.default === 'object' && 'initialize' in module.default) {
      return module.default as Plugin;
    } else {
      throw new Error(`Module at ${pluginPath} does not export a valid Plugin`);
    }
  } catch (error) {
    // Handle errors during dynamic import
    if (error instanceof Error) {
      console.error(`Failed to load plugin from ${pluginPath}: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while loading plugin from ${pluginPath}`);
    }
    throw error; // Re-throw after logging
  }
}

// Example usage
(async () => {
  const pluginPath = path.resolve(__dirname, 'plugins', 'examplePlugin');
  
  try {
    const plugin = await loadPlugin(pluginPath);
    console.log(`Successfully loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
    
    // Initialize the plugin (assuming we have a context to pass)
    // await plugin.initialize(context);
    
  } catch (error) {
    console.error('Error loading plugin:', error);
  }
})();