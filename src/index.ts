#!/usr/bin/env node

/**
 * CLI Entry Point
 * 
 * Bootstraps the plugin-based CLI application:
 * 1. Initialize core services (Logger, Config, ServiceContainer, HookRegistry, MessageBus)
 * 2. Create Commander.js program
 * 3. Initialize PluginManager and load all plugins
 * 4. Trigger lifecycle hooks:
 *    - cli:startup (broadcast)
 *    - cli:register-commands (filter, passes program)
 * 5. Parse command-line arguments
 * 6. On exit, trigger cli:shutdown hook
 * 
 * The core does NO command registration - everything comes from plugins.
 */

import { Command } from 'commander';
import * as path from 'path';
import { Logger } from './core/Logger';
import { Config } from './core/Config';
import { ServiceContainer } from './core/ServiceContainer';
import { HookRegistry } from './hooks/HookRegistry';
import { MessageBus } from './bus/MessageBus';
import { PluginManager } from './plugins/PluginManager';

/**
 * Main application entry point
 */
async function main() {
  // 1. Initialize core services
  const logger = new Logger('core', 'info');
  const config = new Config();
  const services = new ServiceContainer();
  const hooks = new HookRegistry(logger);
  const bus = new MessageBus(logger);
  
  logger.info('Starting CLI application...');
  
  // 2. Create Commander program (root command)
  const program = new Command();
  program
    .name('plugin-cli')
    .description('A CLI application with plugin architecture')
    .version('1.0.0');
  
  // 3. Initialize Plugin Manager
  const pluginDirs = [
    path.join(__dirname, '..', 'plugins'), // Project plugins
  ];
  
  const pluginManager = new PluginManager(
    pluginDirs,
    logger,
    config,
    services,
    hooks,
    bus,
    program
  );
  
  // 4. Load and initialize all plugins
  try {
    await pluginManager.initializeAll();
  } catch (error) {
    logger.error('Failed to initialize plugins', error);
    process.exit(1);
  }
  
  // 5. Trigger cli:startup hook (broadcast)
  await hooks.broadcast('cli:startup', { config, services, bus });
  
  // 6. Trigger cli:register-commands hook (filter)
  // Plugins can use this to register their commands
  await hooks.trigger('cli:register-commands', program);
  
  // 7. Parse command-line arguments
  // If no command specified and no default action, show help
  if (process.argv.length <= 2) {
    program.outputHelp();
    process.exit(0);
  }
  
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    logger.error('Command execution failed', error);
    process.exit(1);
  }
  
  // 8. Trigger cli:shutdown hook (broadcast)
  await hooks.broadcast('cli:shutdown', { config, services, bus });
  
  // 9. Shutdown plugins
  await pluginManager.shutdown();
  
  logger.info('CLI application shutdown complete');
}

/**
 * Error handler for unhandled rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Error handler for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

/**
 * Graceful shutdown handler
 */
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
