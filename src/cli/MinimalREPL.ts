/**
 * Minimal REPL (Phase 1)
 * 
 * A bare-bones interactive REPL shell that:
 * - Displays a prompt: "DummyApp> "
 * - Accepts user input
 * - Handles built-in commands: exit, help
 * - Shows "Command not found" for unknown commands
 * - Exits gracefully on Ctrl+C or "exit"
 * 
 * NO plugin integration, NO external libraries.
 * Uses only Node.js built-in 'readline' module.
 * 
 * Usage:
 *   const repl = new MinimalREPL();
 *   repl.start();
 */

import * as readline from 'readline';

/**
 * MinimalREPL - Phase 1 implementation
 * 
 * A simple REPL shell without plugin integration.
 * Foundation for Phase 2 enhancements.
 */
export class MinimalREPL {
  private rl: readline.Interface | null = null;
  private isRunning: boolean = false;

  /**
   * Start the REPL loop
   * 
   * Creates readline interface, sets up event handlers,
   * and begins accepting user input.
   */
  public start(): void {
    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'DummyApp> ',
    });

    this.isRunning = true;

    // Handle user input (line by line)
    this.rl.on('line', (input: string) => {
      this.handleCommand(input);
      
      // Show prompt again after command completes
      if (this.isRunning && this.rl) {
        this.rl.prompt();
      }
    });

    // Handle REPL close (Ctrl+D or programmatic close)
    this.rl.on('close', () => {
      if (this.isRunning) {
        this.shutdown();
      }
    });

    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', () => {
      console.log('\n'); // Newline after ^C
      this.shutdown();
    });

    // Show first prompt
    this.rl.prompt();
  }

  /**
   * Handle a single command input
   * 
   * Parses the input, routes to appropriate handler,
   * or shows "command not found" error.
   * 
   * @param input - Raw user input string
   */
  private handleCommand(input: string): void {
    try {
      // Trim whitespace
      const trimmed = input.trim();

      // Skip empty lines
      if (!trimmed) {
        return;
      }

      // Split into command and arguments
      const parts = trimmed.split(/\s+/);
      const command = parts[0]?.toLowerCase();
      // Arguments (args) will be used in Phase 2

      // Route to handlers
      switch (command) {
        case 'exit':
        case 'quit':
          this.commandExit();
          break;

        case 'help':
          this.commandHelp();
          break;

        default:
          console.error(`Error: Unknown command '${command}'`);
          console.error(`Type 'help' for available commands.`);
      }
    } catch (error) {
      // Catch any unexpected errors
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
    }
  }

  /**
   * Command: exit
   * 
   * Exits the REPL gracefully
   */
  private commandExit(): void {
    console.log('Exiting REPL...');
    this.shutdown();
  }

  /**
   * Command: help
   * 
   * Shows list of available commands
   */
  private commandHelp(): void {
    console.log('Available commands:');
    console.log('  help         Show this help message');
    console.log('  exit, quit   Exit the REPL');
  }

  /**
   * Shutdown the REPL
   * 
   * Cleans up resources and exits the process
   */
  private shutdown(): void {
    if (!this.isRunning) {
      return; // Already shut down
    }

    this.isRunning = false;

    // Close readline interface
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    console.log('Goodbye!');
    process.exit(0);
  }
}
