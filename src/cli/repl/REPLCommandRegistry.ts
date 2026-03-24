/**
 * REPL Command Registry
 * 
 * Central registry for all REPL commands contributed by plugins.
 * Provides command registration, lookup, execution, and completion.
 * 
 * Similar to HookRegistry but specialized for REPL commands:
 * - Commands are stored by name (primary + aliases)
 * - Supports command namespacing (plugin:command)
 * - Provides tab completion suggestions
 * - Routes input to appropriate handlers
 */

import { REPLCommand, REPLContext, isREPLCommand } from '../../types/repl';
import { Logger } from '../../core/Logger';

/**
 * REPLCommandRegistry
 * 
 * Manages REPL command registration and execution.
 * Thread-safe for concurrent registration during plugin initialization.
 */
export class REPLCommandRegistry {
  /**
   * Map of command name -> command definition
   * Includes both primary names and aliases
   */
  private commands: Map<string, REPLCommand> = new Map();

  /**
   * Logger for debugging command registration
   */
  private logger: Logger;

  /**
   * Create a new command registry
   * 
   * @param logger - Logger instance for debugging
   */
  constructor(logger: Logger) {
    this.logger = logger.child('repl-registry');
  }

  /**
   * Register a new REPL command
   * 
   * Registers the command under its primary name and all aliases.
   * Throws error if command name/alias conflicts with existing command.
   * 
   * @param command - Command definition to register
   * @throws Error if command is invalid or name conflicts
   */
  register(command: REPLCommand): void {
    // Validate command structure
    if (!isREPLCommand(command)) {
      throw new Error('Invalid REPLCommand: missing required fields');
    }

    // Normalize command name (lowercase)
    const name = command.name.toLowerCase();

    // Check for conflicts
    if (this.commands.has(name)) {
      const existing = this.commands.get(name);
      throw new Error(
        `Command name conflict: "${name}" already registered by plugin "${existing?.plugin || 'unknown'}"`
      );
    }

    // Register primary name
    this.commands.set(name, command);
    this.logger.debug(`Registered REPL command: ${name}`);

    // Register aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        const normalizedAlias = alias.toLowerCase();

        if (this.commands.has(normalizedAlias)) {
          // Rollback primary registration
          this.commands.delete(name);
          throw new Error(
            `Command alias conflict: "${normalizedAlias}" already registered`
          );
        }

        // Alias points to the same command object
        this.commands.set(normalizedAlias, command);
        this.logger.debug(`Registered alias: ${normalizedAlias} -> ${name}`);
      }
    }
  }

  /**
   * Unregister a command and all its aliases
   * 
   * @param name - Primary command name or alias to remove
   */
  unregister(name: string): void {
    const normalizedName = name.toLowerCase();
    const command = this.commands.get(normalizedName);

    if (!command) {
      this.logger.warn(`Cannot unregister unknown command: ${name}`);
      return;
    }

    // Remove primary name
    this.commands.delete(command.name.toLowerCase());

    // Remove all aliases
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.delete(alias.toLowerCase());
      }
    }

    this.logger.debug(`Unregistered command: ${name}`);
  }

  /**
   * Execute a command from user input
   * 
   * Parses the input, looks up the command, and executes it.
   * Returns false if command not found, true if executed (even if handler threw error).
   * 
   * @param input - Raw user input string (e.g., "hello Alice")
   * @param context - REPL execution context
   * @returns Promise<boolean> - True if command found and executed
   */
  async execute(input: string, context: REPLContext): Promise<boolean> {
    // Parse input into command + args
    const trimmed = input.trim();
    if (!trimmed) {
      return false; // Empty input
    }

    const parts = trimmed.split(/\s+/);
    const commandName = (parts[0] || '').toLowerCase();
    const args = parts.slice(1);

    // Look up command
    const command = this.commands.get(commandName);
    if (!command) {
      return false; // Command not found
    }

    try {
      // Execute command handler
      this.logger.debug(`Executing REPL command: ${commandName} with args:`, args);
      await command.handler(args, context);
      return true;
    } catch (error) {
      // Command executed but handler threw error
      context.logger.error(`Error executing command "${commandName}"`, error);
      return true; // Return true because command was found (error is in handler)
    }
  }

  /**
   * Get a specific command by name or alias
   * 
   * @param name - Command name or alias
   * @returns Command definition or undefined if not found
   */
  getCommand(name: string): REPLCommand | undefined {
    return this.commands.get(name.toLowerCase());
  }

  /**
   * Get all registered commands (unique, no duplicates from aliases)
   * 
   * @returns Array of unique command definitions
   */
  getAllCommands(): REPLCommand[] {
    // Use Set to deduplicate (aliases point to same object)
    const uniqueCommands = new Set<REPLCommand>();

    for (const command of this.commands.values()) {
      uniqueCommands.add(command);
    }

    return Array.from(uniqueCommands);
  }

  /**
   * Get command names that match a partial input (for tab completion)
   * 
   * @param partial - Partial command name (e.g., "hel")
   * @returns Array of matching command names (sorted)
   */
  getCompletions(partial: string): string[] {
    const normalizedPartial = partial.toLowerCase();
    const matches: string[] = [];

    for (const name of this.commands.keys()) {
      if (name.startsWith(normalizedPartial)) {
        // Only include primary names, not aliases
        const command = this.commands.get(name);
        if (command && command.name.toLowerCase() === name) {
          matches.push(name);
        }
      }
    }

    return matches.sort();
  }

  /**
   * Get count of registered commands (unique, excluding aliases)
   * 
   * @returns Number of unique commands
   */
  getCommandCount(): number {
    return this.getAllCommands().length;
  }

  /**
   * Clear all registered commands
   * Typically used during shutdown or testing
   */
  clear(): void {
    this.commands.clear();
    this.logger.debug('Cleared all REPL commands');
  }

  /**
   * Check if a command is registered
   * 
   * @param name - Command name to check
   * @returns True if command exists
   */
  has(name: string): boolean {
    return this.commands.has(name.toLowerCase());
  }
}
