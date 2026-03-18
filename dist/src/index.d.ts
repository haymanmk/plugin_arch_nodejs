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
export {};
//# sourceMappingURL=index.d.ts.map