/**
 * Enhanced REPL Controller
 * 
 * Plugin-aware REPL that integrates with the entire plugin architecture.
 * 
 * Features:
 * - Bootstrap all core services (Logger, Config, ServiceContainer, etc.)
 * - Initialize PluginManager and load all plugins
 * - Trigger repl:register-commands hook for plugin command registration
 * - Execute commands via REPLCommandRegistry
 * - Built-in commands: exit, help, clear, plugins
 * - Session state management
 * - Tab completion support
 * - Signal handling (Ctrl+C)
 */

import * as readline from 'readline';
import { Logger } from '../../core/Logger';
import { Config } from '../../core/Config';
import { ServiceContainer } from '../../core/ServiceContainer';
import { HookRegistry } from '../../hooks/HookRegistry';
import { MessageBus } from '../../bus/MessageBus';
import { PluginManager } from '../../plugins/PluginManager';
import { REPLCommandRegistry } from './REPLCommandRegistry';
import { REPLContext } from '../../types/repl';
import * as path from 'path';

/**
 * EnhancedREPL
 * 
 * Full-featured REPL with plugin integration.
 * Manages the entire lifecycle: bootstrap → register commands → interactive loop → shutdown
 */
export class EnhancedREPL {
  private rl: readline.Interface | null = null;
  private isRunning: boolean = false;

  // Core services
  private logger!: Logger;
  private config!: Config;
  private services!: ServiceContainer;
  private hooks!: HookRegistry;
  private bus!: MessageBus;
  private pluginManager!: PluginManager;
  private commandRegistry!: REPLCommandRegistry;

  // REPL state
  private session: Map<string, unknown> = new Map();
  private context!: REPLContext;

  /**
   * Start the REPL
   * 
   * Performs full bootstrap sequence:
   * 1. Initialize core services
   * 2. Load plugins
   * 3. Register commands (including built-ins)
   * 4. Start interactive loop
   */
  async start(): Promise<void> {
    try {
      // Bootstrap core services
      await this.bootstrap();

      // Display welcome banner
      this.displayWelcome();

      // Create readline interface
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'plugin> ',
        completer: this.getCompleter(),
      });

      this.isRunning = true;

      // Handle user input
      this.rl.on('line', async (input: string) => {
        await this.handleLine(input);

        // Show prompt again
        if (this.isRunning && this.rl) {
          this.rl.prompt();
        }
      });

      // Handle REPL close
      this.rl.on('close', () => {
        if (this.isRunning) {
          this.shutdown();
        }
      });

      // Signal handlers
      this.setupSignalHandlers();

      // Trigger repl:startup hook
      await this.hooks.broadcast('repl:startup', { session: this.session });

      // Show first prompt
      this.rl.prompt();
    } catch (error) {
      console.error('Failed to start REPL:', error);
      process.exit(1);
    }
  }

  /**
   * Bootstrap all core services and plugins
   */
  private async bootstrap(): Promise<void> {
    // Initialize core services
    this.logger = new Logger('repl');
    this.config = new Config();
    this.services = new ServiceContainer();
    this.hooks = new HookRegistry(this.logger.child('hooks'));
    this.bus = new MessageBus(this.logger.child('bus'));

    // Initialize command registry
    this.commandRegistry = new REPLCommandRegistry(this.logger);

    // Create REPL context (shared across all command executions)
    this.context = {
      logger: this.logger,
      config: this.config,
      services: this.services,
      bus: this.bus,
      session: this.session,
      print: (msg: string) => console.log(msg),
      printError: (msg: string) => console.error(msg),
    };

    // Initialize plugin manager
    const pluginDirs = [path.resolve(__dirname, '../../../plugins')];
    this.pluginManager = new PluginManager(
      pluginDirs,
      this.logger.child('plugin-manager'),
      this.config,
      this.services,
      this.hooks,
      this.bus,
      {} as any // Dummy program object for REPL (not using Commander)
    );

    // Load and initialize all plugins
    this.logger.info('Loading plugins...');
    await this.pluginManager.initializeAll();
    const pluginCount = this.pluginManager.getPluginNames().length;
    this.logger.success(`Loaded ${pluginCount} plugins`);

    // Register built-in commands
    this.registerBuiltInCommands();

    // Trigger hook for plugins to register REPL commands
    await this.hooks.broadcast('repl:register-commands', this.commandRegistry);

    this.logger.info(`${this.commandRegistry.getCommandCount()} REPL commands available`);
  }

  /**
   * Register built-in REPL commands
   */
  private registerBuiltInCommands(): void {
    // exit command
    this.commandRegistry.register({
      name: 'exit',
      aliases: ['quit', 'q'],
      description: 'Exit the REPL',
      handler: () => {
        this.shutdown();
      },
    });

    // help command
    this.commandRegistry.register({
      name: 'help',
      aliases: ['?'],
      description: 'Show available commands',
      usage: 'help [command]',
      handler: (args) => {
        if (args.length > 0 && args[0]) {
          this.showCommandHelp(args[0]);
        } else {
          this.showHelp();
        }
      },
    });

    // clear command
    this.commandRegistry.register({
      name: 'clear',
      aliases: ['cls'],
      description: 'Clear the screen',
      handler: () => {
        console.clear();
      },
    });

    // plugins command
    this.commandRegistry.register({
      name: 'plugins',
      description: 'List loaded plugins',
      handler: () => {
        this.listPlugins();
      },
    });
  }

  /**
   * Handle a line of user input
   * 
   * @param input - Raw user input
   */
  private async handleLine(input: string): Promise<void> {
    try {
      const trimmed = input.trim();

      // Skip empty lines
      if (!trimmed) {
        return;
      }

      // Try to execute command via registry
      const executed = await this.commandRegistry.execute(trimmed, this.context);

      if (!executed) {
        // Command not found
        this.logger.error(`Command not found: ${trimmed.split(/\s+/)[0]}`);
        console.log('Type "help" to see available commands');
      }
    } catch (error) {
      this.logger.error('Error handling command', error);
    }
  }

  /**
   * Display welcome banner
   */
  private displayWelcome(): void {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║       Plugin-Based CLI - Interactive REPL             ║');
    console.log('║                                                       ║');
    console.log('║  Type "help" for available commands                  ║');
    console.log('║  Type "exit" or press Ctrl+C to quit                 ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
  }

  /**
   * Show help for all commands
   */
  private showHelp(): void {
    const commands = this.commandRegistry.getAllCommands();

    console.log('\nAvailable Commands:\n');

    for (const cmd of commands.sort((a, b) => a.name.localeCompare(b.name))) {
      const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
      const usage = cmd.usage ? `  Usage: ${cmd.usage}` : '';
      const plugin = cmd.plugin ? ` [${cmd.plugin}]` : '';

      console.log(`  ${cmd.name}${aliases}${plugin}`);
      console.log(`    ${cmd.description}${usage}`);
      console.log('');
    }
  }

  /**
   * Show help for a specific command
   * 
   * @param name - Command name
   */
  private showCommandHelp(name: string): void {
    const command = this.commandRegistry.getCommand(name);

    if (!command) {
      this.logger.error(`Unknown command: ${name}`);
      return;
    }

    console.log('');
    console.log(`Command: ${command.name}`);
    if (command.aliases && command.aliases.length > 0) {
      console.log(`Aliases: ${command.aliases.join(', ')}`);
    }
    console.log(`Description: ${command.description}`);
    if (command.usage) {
      console.log(`Usage: ${command.usage}`);
    }
    if (command.plugin) {
      console.log(`Plugin: ${command.plugin}`);
    }
    console.log('');
  }

  /**
   * List all loaded plugins
   */
  private listPlugins(): void {
    const pluginNames = this.pluginManager.getPluginNames();

    console.log(`\nLoaded Plugins (${pluginNames.length}):\n`);

    for (const name of pluginNames) {
      const plugin = this.pluginManager.getPlugin(name);
      if (!plugin) continue;
      
      const status = this.pluginManager.isEnabled(name) ? '✓' : '✗';
      const deps = plugin.metadata.dependencies && plugin.metadata.dependencies.length > 0
        ? ` (depends on: ${plugin.metadata.dependencies.join(', ')})`
        : '';

      console.log(`  ${status} ${plugin.metadata.name} v${plugin.metadata.version}${deps}`);
      console.log(`    ${plugin.metadata.description || 'No description'}`);
      console.log('');
    }
  }

  /**
   * Get tab completion function
   * 
   * Context-aware completion that supports:
   * - Command name completion
   * - File/path completion for command arguments
   * 
   * @returns Completer function for readline
   */
  private getCompleter(): readline.Completer {
    return (line: string) => {
      const trimmed = line.trimStart();
      
      // Empty line - show all commands
      if (!trimmed) {
        const allCommands = this.commandRegistry.getCompletions('');
        return [allCommands, ''];
      }
      
      const parts = trimmed.split(/\s+/);
      
      // Case 1: Completing command name (first word, not yet confirmed)
      // "hel" or "hello " (with space but could still be typing command)
      if (parts.length === 1) {
        const commandPart = parts[0] || '';
        const completions = this.commandRegistry.getCompletions(commandPart);
        return [completions, commandPart];
      }
      
      // Case 2: Completing command arguments
      const commandName = parts[0] || '';
      const command = this.commandRegistry.getCommand(commandName);
      
      if (!command) {
        return [[], line]; // Unknown command, no completions
      }
      
      // Determine which argument is being completed
      // If line ends with space, we're starting a new argument
      // Otherwise, we're completing the last partial argument
      const argIndex = line.endsWith(' ') ? parts.length - 1 : parts.length - 2;
      const partial = line.endsWith(' ') ? '' : (parts[parts.length - 1] || '');
      
      // Check if command defines argument types
      const argType = command.argumentTypes?.[argIndex];
      
      if (!argType || argType === 'string') {
        // No special completion for string arguments
        return [[], line];
      }
      
      if (argType === 'file' || argType === 'path' || argType === 'directory') {
        const fileCompletions = this.getFileCompletions(partial, argType);
        return [fileCompletions, partial];
      }
      
      // No completion available
      return [[], line];
    };
  }

  /**
   * Get file/directory completions for a partial path
   * 
   * Supports:
   * - Relative paths (./src/cli/)
   * - Absolute paths (/home/user/)
   * - Current directory (no prefix)
   * 
   * @param partial - Partial path being typed
   * @param type - Type of completion (file, directory, or path)
   * @returns Array of matching paths
   */
  private getFileCompletions(partial: string, type: 'file' | 'directory' | 'path'): string[] {
    const fs = require('fs');
    
    try {
      // Determine directory to search and prefix
      let searchDir = '.';
      let prefix = partial;
      
      if (partial.includes('/')) {
        searchDir = path.dirname(partial);
        prefix = path.basename(partial);
        
        // Handle empty dirname (e.g., "/file" -> dirname is "/")
        if (searchDir === '.') {
          searchDir = process.cwd();
        }
      }
      
      // Read directory contents
      const entries = fs.readdirSync(searchDir, { withFileTypes: true });
      
      // Filter based on type and prefix
      const matches = entries
        .filter((entry: any) => {
          // Skip hidden files unless explicitly requested
          if (prefix === '' && entry.name.startsWith('.')) {
            return false;
          }
          
          // Filter by type
          if (type === 'file' && !entry.isFile()) return false;
          if (type === 'directory' && !entry.isDirectory()) return false;
          // 'path' accepts both files and directories
          
          // Filter by prefix (case-insensitive for better UX)
          return entry.name.toLowerCase().startsWith(prefix.toLowerCase());
        })
        .map((entry: any) => {
          // Build full path
          let fullPath: string;
          if (searchDir === '.') {
            fullPath = entry.name;
          } else if (partial.includes('/')) {
            // Reconstruct with original directory path
            fullPath = path.join(path.dirname(partial), entry.name);
          } else {
            fullPath = entry.name;
          }
          
          // Add trailing slash for directories (visual indicator)
          return entry.isDirectory() ? fullPath + '/' : fullPath;
        })
        .sort();
      
      return matches;
    } catch (error) {
      // Directory doesn't exist, permission denied, or other error
      return [];
    }
  }

  /**
   * Setup signal handlers (Ctrl+C, etc.)
   */
  private setupSignalHandlers(): void {
    process.on('SIGINT', () => {
      console.log('\n');
      this.shutdown();
    });
  }

  /**
   * Shutdown the REPL and cleanup
   */
  private shutdown(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    console.log('Shutting down REPL...');

    // Trigger shutdown hook
    this.hooks.broadcast('repl:shutdown', { session: this.session }).catch(() => {
      // Ignore errors during shutdown
    });

    // Shutdown plugins
    if (this.pluginManager) {
      this.logger.info('Shutting down plugins...');
      this.pluginManager.shutdown().catch(() => {
        // Ignore errors during shutdown
      });
    }

    // Close readline
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    console.log('Goodbye!');
    process.exit(0);
  }
}
