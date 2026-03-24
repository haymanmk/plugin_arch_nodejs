/**
 * Hello World Plugin
 * 
 * A simple greeting command that demonstrates:
 * - Using services from another plugin (Formatter from base-formatter)
 * - Publishing events to the MessageBus
 * - Declaring plugin dependencies
 * - Registering CLI commands via hooks
 * 
 * Usage: plugin-cli hello [name]
 * Example: plugin-cli hello Alice → "Hello, Alice!"
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';
import { Command } from 'commander';
import { REPLCommandRegistry } from '../../src/cli/repl/REPLCommandRegistry';

/**
 * Formatter interface (provided by base-formatter plugin)
 * We import the type to use it, but get the actual instance from ServiceContainer
 */
interface Formatter {
  success(message: string): void;
  info(message: string): void;
  keyValue(key: string, value: string): void;
}

/**
 * Hello World Plugin
 * Provides a simple greeting command
 */
class HelloWorldPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'hello-world',
    version: '1.0.0',
    description: 'Provides a hello command for greeting users',
    // This plugin depends on base-formatter being loaded first
    dependencies: ['base-formatter']
  };
  
  private formatter?: Formatter;
  
  async initialize(context: PluginContext): Promise<void> {
    const { logger, services, bus, hooks } = context;
    
    logger.info('Initializing hello-world plugin');
    
    // Get the Formatter service from the container
    // base-formatter registered this, so it's available
    try {
      this.formatter = services.get<Formatter>('formatter');
    } catch (error) {
      // Formatter not available - we'll use fallback in executeHello
      logger.warn('Formatter service not available, using console fallback');
    }
    
    // Register the 'hello' command via hook
    hooks.register<Command>('cli:register-commands', (program) => {
      program
        .command('hello [name]')
        .description('Say hello to someone')
        .action((name?: string) => {
          this.executeHello(name || 'World', bus, logger);
        });
      
      return program; // Filter hook pattern
    });
    
    // Register REPL command
    hooks.register<REPLCommandRegistry>('repl:register-commands', (registry) => {
      registry.register({
        name: 'hello',
        aliases: ['hi', 'greet'],
        description: 'Say hello to someone',
        usage: 'hello [name]',
        plugin: this.metadata.name,
        handler: async (args, context) => {
          const name = args[0] || 'World';
          this.executeHelloREPL(name, context);
        },
      });
      return registry;
    });
    
    logger.success('Hello-world plugin initialized');
  }
  
  /**
   * Execute the hello command (CLI version)
   * 
   * @param name - Name to greet (defaults to "World")
   * @param bus - MessageBus for publishing events
   * @param logger - Logger for debug output
   */
  private executeHello(name: string, bus: any, logger: any): void {
    // Format and display the greeting using the Formatter service
    if (this.formatter) {
      this.formatter.success(`Hello, ${name}!`);
      this.formatter.keyValue('Greeting sent to', name);
    } else {
      // Fallback if formatter not available (shouldn't happen)
      console.log(`Hello, ${name}!`);
    }
    
    // Publish command execution event for usage tracking
    bus.publish('command:executed', {
      command: 'hello',
      args: [name]
    });
    
    logger.debug(`Hello command executed for: ${name}`);
  }
  
  /**
   * Execute the hello command (REPL version)
   * 
   * @param name - Name to greet
   * @param context - REPL execution context
   */
  private executeHelloREPL(name: string, context: any): void {
    // Format and display greeting
    if (this.formatter) {
      this.formatter.success(`Hello, ${name}!`);
    } else {
      context.print(`Hello, ${name}!`);
    }
    
    // Publish event
    context.bus.publish('command:executed', {
      command: 'hello',
      args: [name],
      source: 'repl'
    });
  }
  
  async shutdown(): Promise<void> {
    // Cleanup if needed (none required for this plugin)
  }
}

// Export plugin instance
export default new HelloWorldPlugin();
