/**
 * File Stats Plugin
 * 
 * Provides file system statistics command that demonstrates:
 * - Async file system operations (fs.stat)
 * - Error handling for missing files
 * - Using shared formatter service
 * - Declaring dependencies on other plugins
 * 
 * Usage: plugin-cli stats <path>
 * Example: plugin-cli stats ./package.json
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';
import { Command } from 'commander';
import { REPLCommandRegistry } from '../../src/cli/repl/REPLCommandRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Formatter interface (provided by base-formatter plugin)
 */
interface Formatter {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
  keyValue(key: string, value: string): void;
}

/**
 * File Stats Plugin
 * Displays file information using fs.stat
 */
class FileStatsPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'file-stats',
    version: '1.0.0',
    description: 'Provides file statistics command',
    // Depends on base-formatter for consistent output formatting
    dependencies: ['base-formatter']
  };
  
  private formatter?: Formatter;
  
  async initialize(context: PluginContext): Promise<void> {
    const { logger, services, bus, hooks } = context;
    
    logger.info('Initializing file-stats plugin');
    
    // Get the Formatter service from the container
    this.formatter = services.get<Formatter>('formatter');
    
    // Register the 'stats' command via hook
    hooks.register<Command>('cli:register-commands', (program) => {
      program
        .command('stats <path>')
        .description('Show file or directory statistics')
        .action(async (filePath: string) => {
          await this.executeStats(filePath, bus, logger);
        });
      
      return program; // Filter hook pattern
    });
    
    // Register REPL command
    hooks.register<REPLCommandRegistry>('repl:register-commands', (registry) => {
      registry.register({
        name: 'stats',
        aliases: ['info', 'stat'],
        description: 'Show file or directory statistics',
        usage: 'stats <path>',
        plugin: this.metadata.name,
        argumentTypes: ['path'], // Enable file/path autocompletion for first argument
        handler: async (args, context) => {
          if (args.length === 0 || !args[0]) {
            context.printError('Error: Missing required argument <path>');
            context.print('Usage: stats <path>');
            return;
          }
          await this.executeStatsREPL(args[0], context);
        },
      });
      return registry;
    });
    
    logger.success('File-stats plugin initialized');
  }
  
  /**
   * Execute the stats command (CLI version)
   * 
   * @param filePath - Path to file or directory
   * @param bus - MessageBus for publishing events
   * @param logger - Logger for debug output
   */
  private async executeStats(filePath: string, bus: any, logger: any): Promise<void> {
    try {
      // Resolve absolute path
      const absolutePath = path.resolve(filePath);
      
      // Get file stats
      const stats = await fs.stat(absolutePath);
      
      // Format and display file information
      if (this.formatter) {
        this.formatter.success(`File Statistics: ${filePath}`);
        console.log(); // Empty line for readability
        
        this.formatter.keyValue('Path', absolutePath);
        this.formatter.keyValue('Type', stats.isDirectory() ? 'Directory' : 'File');
        this.formatter.keyValue('Size', `${stats.size} bytes`);
        this.formatter.keyValue('Created', stats.birthtime.toISOString());
        this.formatter.keyValue('Modified', stats.mtime.toISOString());
        this.formatter.keyValue('Accessed', stats.atime.toISOString());
        
        if (!stats.isDirectory()) {
          this.formatter.keyValue('Readable', stats.mode & fs.constants.R_OK ? 'Yes' : 'No');
          this.formatter.keyValue('Writable', stats.mode & fs.constants.W_OK ? 'Yes' : 'No');
          this.formatter.keyValue('Executable', stats.mode & fs.constants.X_OK ? 'Yes' : 'No');
        }
      } else {
        // Fallback formatting
        console.log(`File: ${absolutePath}`);
        console.log(`Size: ${stats.size} bytes`);
        console.log(`Modified: ${stats.mtime}`);
      }
      
      // Publish command execution event for usage tracking
      bus.publish('command:executed', {
        command: 'stats',
        args: [filePath]
      });
      
      logger.debug(`Stats command executed for: ${filePath}`);
      
    } catch (error) {
      // Handle errors (file not found, permission denied, etc.)
      if (this.formatter) {
        if (error instanceof Error) {
          this.formatter.error(`Failed to get stats: ${error.message}`);
        } else {
          this.formatter.error('Failed to get file statistics');
        }
      } else {
        console.error(`Error: ${error}`);
      }
      
      logger.error(`Stats command failed for ${filePath}`, error);
      process.exit(1);
    }
  }
  
  /**
   * Execute the stats command (REPL version)
   * 
   * @param filePath - Path to file or directory
   * @param context - REPL execution context
   */
  private async executeStatsREPL(filePath: string, context: any): Promise<void> {
    try {
      // Resolve absolute path
      const absolutePath = path.resolve(filePath);
      
      // Get file stats
      const stats = await fs.stat(absolutePath);
      
      // Format and display file information
      if (this.formatter) {
        this.formatter.success(`File Statistics: ${filePath}`);
        console.log();
        
        this.formatter.keyValue('Path', absolutePath);
        this.formatter.keyValue('Type', stats.isDirectory() ? 'Directory' : 'File');
        this.formatter.keyValue('Size', `${stats.size} bytes`);
        this.formatter.keyValue('Created', stats.birthtime.toISOString());
        this.formatter.keyValue('Modified', stats.mtime.toISOString());
        this.formatter.keyValue('Accessed', stats.atime.toISOString());
        
        if (!stats.isDirectory()) {
          this.formatter.keyValue('Readable', stats.mode & fs.constants.R_OK ? 'Yes' : 'No');
          this.formatter.keyValue('Writable', stats.mode & fs.constants.W_OK ? 'Yes' : 'No');
          this.formatter.keyValue('Executable', stats.mode & fs.constants.X_OK ? 'Yes' : 'No');
        }
      } else {
        context.print(`File: ${absolutePath}`);
        context.print(`Size: ${stats.size} bytes`);
      }
      
      // Publish event
      context.bus.publish('command:executed', {
        command: 'stats',
        args: [filePath],
        source: 'repl'
      });
      
    } catch (error) {
      if (error instanceof Error) {
        context.printError(`Error: ${error.message}`);
      } else {
        context.printError('Failed to get file statistics');
      }
    }
  }
  
  async shutdown(): Promise<void> {
    // Cleanup if needed (none required for this plugin)
  }
}

// Export plugin instance
export default new FileStatsPlugin();
