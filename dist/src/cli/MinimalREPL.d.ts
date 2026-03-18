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
/**
 * MinimalREPL - Phase 1 implementation
 *
 * A simple REPL shell without plugin integration.
 * Foundation for Phase 2 enhancements.
 */
export declare class MinimalREPL {
    private rl;
    private isRunning;
    /**
     * Start the REPL loop
     *
     * Creates readline interface, sets up event handlers,
     * and begins accepting user input.
     */
    start(): void;
    /**
     * Handle a single command input
     *
     * Parses the input, routes to appropriate handler,
     * or shows "command not found" error.
     *
     * @param input - Raw user input string
     */
    private handleCommand;
    /**
     * Command: exit
     *
     * Exits the REPL gracefully
     */
    private commandExit;
    /**
     * Command: help
     *
     * Shows list of available commands
     */
    private commandHelp;
    /**
     * Shutdown the REPL
     *
     * Cleans up resources and exits the process
     */
    private shutdown;
}
//# sourceMappingURL=MinimalREPL.d.ts.map