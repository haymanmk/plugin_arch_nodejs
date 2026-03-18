"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimalREPL = void 0;
const readline = __importStar(require("readline"));
/**
 * MinimalREPL - Phase 1 implementation
 *
 * A simple REPL shell without plugin integration.
 * Foundation for Phase 2 enhancements.
 */
class MinimalREPL {
    constructor() {
        this.rl = null;
        this.isRunning = false;
    }
    /**
     * Start the REPL loop
     *
     * Creates readline interface, sets up event handlers,
     * and begins accepting user input.
     */
    start() {
        // Create readline interface
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'DummyApp> ',
        });
        this.isRunning = true;
        // Handle user input (line by line)
        this.rl.on('line', (input) => {
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
    handleCommand(input) {
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
        }
        catch (error) {
            // Catch any unexpected errors
            if (error instanceof Error) {
                console.error(`Error: ${error.message}`);
            }
            else {
                console.error('An unexpected error occurred');
            }
        }
    }
    /**
     * Command: exit
     *
     * Exits the REPL gracefully
     */
    commandExit() {
        console.log('Exiting REPL...');
        this.shutdown();
    }
    /**
     * Command: help
     *
     * Shows list of available commands
     */
    commandHelp() {
        console.log('Available commands:');
        console.log('  help         Show this help message');
        console.log('  exit, quit   Exit the REPL');
    }
    /**
     * Shutdown the REPL
     *
     * Cleans up resources and exits the process
     */
    shutdown() {
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
exports.MinimalREPL = MinimalREPL;
//# sourceMappingURL=MinimalREPL.js.map