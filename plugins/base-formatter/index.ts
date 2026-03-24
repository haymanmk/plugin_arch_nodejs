/**
 * Base Formatter Plugin
 * 
 * A foundational plugin that provides shared formatting services to other plugins.
 * Unlike typical plugins, this one:
 * - Registers NO commands itself
 * - Provides a Formatter service via ServiceContainer
 * - Tracks command usage via MessageBus subscription
 * - Prints usage summary on shutdown
 * 
 * Other plugins depend on this via metadata.dependencies: ['base-formatter']
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';
import chalk from 'chalk';

/**
 * Formatter service interface
 * Provides consistent output formatting across all plugins
 */
export interface Formatter {
  /**
   * Format a success message (green)
   */
  success(message: string): void;
  
  /**
   * Format an error message (red)
   */
  error(message: string): void;
  
  /**
   * Format an info message (blue)
   */
  info(message: string): void;
  
  /**
   * Format a warning message (yellow)
   */
  warning(message: string): void;
  
  /**
   * Format a key-value pair for display
   */
  keyValue(key: string, value: string): void;
  
  /**
   * Format a table row
   */
  tableRow(columns: string[]): void;
}

/**
 * Formatter service implementation
 * Uses chalk for terminal colors
 */
class FormatterService implements Formatter {
  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }
  
  error(message: string): void {
    console.error(chalk.red(`✗ ${message}`));
  }
  
  info(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }
  
  warning(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`));
  }
  
  keyValue(key: string, value: string): void {
    console.log(chalk.cyan(`${key}:`), value);
  }
  
  tableRow(columns: string[]): void {
    console.log(columns.join(' | '));
  }
}

/**
 * Usage statistics tracker
 * Counts how many times each command was executed
 */
class UsageTracker {
  private stats: Map<string, number> = new Map();
  
  /**
   * Record a command execution
   */
  record(commandName: string): void {
    const count = this.stats.get(commandName) || 0;
    this.stats.set(commandName, count + 1);
  }
  
  /**
   * Get all statistics sorted by usage count
   */
  getStats(): Array<{ command: string; count: number }> {
    return Array.from(this.stats.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Print a formatted summary table
   */
  printSummary(formatter: Formatter): void {
    const stats = this.getStats();
    
    if (stats.length === 0) {
      return; // No commands executed
    }
    
    console.log('\n' + chalk.bold('Command Usage Summary:'));
    formatter.tableRow(['Command', 'Executions']);
    formatter.tableRow(['-------', '----------']);
    
    for (const { command, count } of stats) {
      formatter.tableRow([command, count.toString()]);
    }
    
    console.log(); // Empty line
  }
}

/**
 * Base Formatter Plugin
 * Provides shared services and tracks usage
 */
class BaseFormatterPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'base-formatter',
    version: '1.0.0',
    description: 'Provides formatting services and usage tracking for other plugins'
  };
  
  private tracker = new UsageTracker();
  private formatter = new FormatterService();
  
  async initialize(context: PluginContext): Promise<void> {
    const { logger, services, bus, hooks } = context;
    
    logger.info('Initializing base-formatter plugin');
    
    // 1. Register Formatter service in the ServiceContainer
    // Other plugins can access this via context.services.get<Formatter>('formatter')
    services.register<Formatter>('formatter', this.formatter);
    logger.debug('Registered Formatter service in container');
    
    // 2. Subscribe to command execution events
    // Plugins should publish 'command:executed' when they run commands
    bus.subscribe<{ command: string; args: string[] }>('command:executed', (data) => {
      this.tracker.record(data.command);
      logger.debug(`Tracked command execution: ${data.command}`);
    });
    
    // 3. Register shutdown hook to print usage summary
    hooks.register('cli:shutdown', () => {
      this.tracker.printSummary(this.formatter);
    });
    
    logger.success('Base formatter plugin initialized');
  }
  
  async shutdown(): Promise<void> {
    // Cleanup if needed (none required for this plugin)
  }
}

// Export plugin instance
export default new BaseFormatterPlugin();
