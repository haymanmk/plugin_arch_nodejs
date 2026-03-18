#!/usr/bin/env node
"use strict";
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
const commander_1 = require("commander");
const path = __importStar(require("path"));
const Logger_1 = require("./core/Logger");
const Config_1 = require("./core/Config");
const ServiceContainer_1 = require("./core/ServiceContainer");
const HookRegistry_1 = require("./hooks/HookRegistry");
const MessageBus_1 = require("./bus/MessageBus");
const PluginManager_1 = require("./plugins/PluginManager");
/**
 * Main application entry point
 */
async function main() {
    // 1. Initialize core services
    const logger = new Logger_1.Logger('core', 'info');
    const config = new Config_1.Config();
    const services = new ServiceContainer_1.ServiceContainer();
    const hooks = new HookRegistry_1.HookRegistry(logger);
    const bus = new MessageBus_1.MessageBus(logger);
    logger.info('Starting CLI application...');
    // 2. Create Commander program (root command)
    const program = new commander_1.Command();
    program
        .name('plugin-cli')
        .description('A CLI application with plugin architecture')
        .version('1.0.0');
    // 3. Initialize Plugin Manager
    const pluginDirs = [
        path.join(__dirname, '..', 'plugins'), // Project plugins
    ];
    const pluginManager = new PluginManager_1.PluginManager(pluginDirs, logger, config, services, hooks, bus, program);
    // 4. Load and initialize all plugins
    try {
        await pluginManager.initializeAll();
    }
    catch (error) {
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
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map