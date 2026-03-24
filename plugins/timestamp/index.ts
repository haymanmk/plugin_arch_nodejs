/**
 * Timestamp Plugin
 * 
 * Provides timestamp command with multiple format options:
 * - ISO format (default): 2026-03-24T12:34:56.789Z
 * - Locale format: 3/24/2026, 12:34:56 PM
 * - Unix timestamp: 1743428096
 * 
 * Demonstrates:
 * - Configuration-driven defaults (Config service)
 * - Commander.js option parsing (--format flag)
 * - Standalone plugin (no dependencies)
 * 
 * Usage: plugin-cli time [--format iso|locale|unix]
 * Example: plugin-cli time --format=unix
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';
import { Command } from 'commander';
import { REPLCommandRegistry } from '../../src/cli/repl/REPLCommandRegistry';

/**
 * Supported timestamp formats
 */
type TimeFormat = 'iso' | 'locale' | 'unix';

/**
 * Timestamp Plugin
 * Displays current time in various formats
 */
class TimestampPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'timestamp',
    version: '1.0.0',
    description: 'Provides time command with multiple format options',
    // No dependencies - this plugin is standalone
  };
  
  private defaultFormat: TimeFormat = 'iso';
  
  async initialize(context: PluginContext): Promise<void> {
    const { logger, config, bus, hooks } = context;
    
    logger.info('Initializing timestamp plugin');
    
    // Read default format from config (if set)
    const configFormat = config.get<string>('defaultFormat', 'timestamp');
    if (configFormat && this.isValidFormat(configFormat)) {
      this.defaultFormat = configFormat as TimeFormat;
      logger.debug(`Using configured default format: ${this.defaultFormat}`);
    } else {
      // Set default in config if not present
      config.set('defaultFormat', this.defaultFormat, 'timestamp');
    }
    
    // Register the 'time' command via hook
    hooks.register<Command>('cli:register-commands', (program) => {
      program
        .command('time')
        .description('Display current timestamp')
        .option('-f, --format <type>', 'Format: iso, locale, or unix', this.defaultFormat)
        .action((options: { format: string }) => {
          this.executeTime(options.format, bus, logger);
        });
      
      return program; // Filter hook pattern
    });
    
    // Register REPL command
    hooks.register<REPLCommandRegistry>('repl:register-commands', (registry) => {
      registry.register({
        name: 'time',
        aliases: ['now', 'date'],
        description: 'Display current timestamp',
        usage: 'time [iso|locale|unix]',
        plugin: this.metadata.name,
        handler: async (args, context) => {
          const format = args[0] || this.defaultFormat;
          this.executeTimeREPL(format, context);
        },
      });
      return registry;
    });
    
    logger.success('Timestamp plugin initialized');
  }
  
  /**
   * Execute the time command (CLI version)
   * 
   * @param format - Desired timestamp format
   * @param bus - MessageBus for publishing events
   * @param logger - Logger for debug output
   */
  private executeTime(format: string, bus: any, logger: any): void {
    const now = new Date();
    const formatLower = format.toLowerCase() as TimeFormat;
    
    // Validate format
    if (!this.isValidFormat(formatLower)) {
      console.error(`Error: Invalid format '${format}'`);
      console.error('Valid formats: iso, locale, unix');
      process.exit(1);
    }
    
    // Format and display timestamp
    let output: string;
    
    switch (formatLower) {
      case 'iso':
        // ISO 8601 format: 2026-03-24T12:34:56.789Z
        output = now.toISOString();
        break;
        
      case 'locale':
        // Locale-specific format: 3/24/2026, 12:34:56 PM
        output = now.toLocaleString();
        break;
        
      case 'unix':
        // Unix timestamp (seconds since epoch)
        output = Math.floor(now.getTime() / 1000).toString();
        break;
        
      default:
        output = now.toISOString();
    }
    
    // Display the formatted timestamp
    console.log(output);
    
    // Publish command execution event for usage tracking
    bus.publish('command:executed', {
      command: 'time',
      args: [format]
    });
    
    logger.debug(`Time command executed with format: ${format}`);
  }
  
  /**
   * Execute the time command (REPL version)
   * 
   * @param format - Desired timestamp format
   * @param context - REPL execution context
   */
  private executeTimeREPL(format: string, context: any): void {
    const now = new Date();
    const formatLower = format.toLowerCase() as TimeFormat;
    
    // Validate format
    if (!this.isValidFormat(formatLower)) {
      context.printError(`Error: Invalid format '${format}'`);
      context.print('Valid formats: iso, locale, unix');
      return;
    }
    
    // Format and display timestamp
    let output: string;
    
    switch (formatLower) {
      case 'iso':
        output = now.toISOString();
        break;
      case 'locale':
        output = now.toLocaleString();
        break;
      case 'unix':
        output = Math.floor(now.getTime() / 1000).toString();
        break;
      default:
        output = now.toISOString();
    }
    
    // Display the formatted timestamp
    context.print(output);
    
    // Publish event
    context.bus.publish('command:executed', {
      command: 'time',
      args: [format],
      source: 'repl'
    });
  }
  
  /**
   * Check if a format string is valid
   */
  private isValidFormat(format: string): boolean {
    return ['iso', 'locale', 'unix'].includes(format);
  }
  
  async shutdown(): Promise<void> {
    // Cleanup if needed (none required for this plugin)
  }
}

// Export plugin instance
export default new TimestampPlugin();
