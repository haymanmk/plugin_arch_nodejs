/**
 * REPL Type Definitions
 * 
 * Types for the plugin-extensible REPL system:
 * - REPLCommand: Interface for commands registered by plugins
 * - REPLContext: Runtime context passed to command handlers
 * - REPLCommandHandler: Function signature for command execution
 */

import { Logger } from '../core/Logger';
import { Config } from '../core/Config';
import { ServiceContainer } from '../core/ServiceContainer';
import { MessageBus } from '../bus/MessageBus';

/**
 * Argument type for autocompletion
 * 
 * Defines what kind of value an argument expects,
 * which determines how tab completion behaves.
 */
export type ArgumentType = 
  | 'string'           // No special completion
  | 'file'             // Complete filenames only
  | 'directory'        // Complete directory names only
  | 'path'             // Complete files and directories
  | 'command';         // Complete other command names

/**
 * REPL Command Handler
 * 
 * Function signature for REPL command execution.
 * Receives parsed arguments and execution context.
 * 
 * @param args - Array of command arguments (strings)
 * @param context - REPL execution context
 * @returns Promise that resolves when command completes
 */
export type REPLCommandHandler = (
  args: string[],
  context: REPLContext
) => Promise<void> | void;

/**
 * REPL Command Definition
 * 
 * Defines a single REPL command that can be registered by plugins.
 * Commands have a name, optional aliases, description, and handler.
 */
export interface REPLCommand {
  /**
   * Primary command name (e.g., "hello", "list", "stats")
   * Must be unique across all registered commands
   */
  name: string;

  /**
   * Alternative names for this command (e.g., ["ls"] for "list")
   */
  aliases?: string[];

  /**
   * Human-readable description for help text
   */
  description: string;

  /**
   * Optional usage example (e.g., "hello <name>")
   */
  usage?: string;

  /**
   * Command execution handler
   */
  handler: REPLCommandHandler;

  /**
   * Plugin that registered this command (for tracking)
   */
  plugin?: string;

  /**
   * Argument types for autocompletion
   * 
   * Array defining the type of each argument position.
   * Used to provide context-aware tab completion.
   * 
   * Example: ['path', 'string'] means:
   * - First argument: complete file/directory paths
   * - Second argument: no special completion
   */
  argumentTypes?: ArgumentType[];
}

/**
 * REPL Execution Context
 * 
 * Runtime context passed to command handlers.
 * Provides access to core services and REPL state.
 */
export interface REPLContext {
  /**
   * Logger service for output
   */
  logger: Logger;

  /**
   * Configuration service
   */
  config: Config;

  /**
   * Service container for accessing plugin services
   */
  services: ServiceContainer;

  /**
   * Message bus for pub/sub communication
   */
  bus: MessageBus;

  /**
   * Session variables (key-value store for REPL session state)
   */
  session: Map<string, unknown>;

  /**
   * Print to stdout without logger formatting
   * Useful for command output that should be plaintext
   */
  print: (message: string) => void;

  /**
   * Print error to stderr without logger formatting
   */
  printError: (message: string) => void;
}

/**
 * Type guard to check if an object is a valid REPLCommand
 * 
 * @param obj - Object to validate
 * @returns True if object matches REPLCommand interface
 */
export function isREPLCommand(obj: unknown): obj is REPLCommand {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const cmd = obj as Partial<REPLCommand>;

  return (
    typeof cmd.name === 'string' &&
    typeof cmd.description === 'string' &&
    typeof cmd.handler === 'function'
  );
}
