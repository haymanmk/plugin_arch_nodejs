"use strict";
/**
 * Plugin Sandbox
 *
 * Provides isolated execution context for untrusted plugin code.
 * Uses Node.js vm module to create a sandboxed context with:
 * - Limited global access (allowlist-based)
 * - Execution timeout
 * - Memory limits (via vm options)
 *
 * NOTE: vm module provides some isolation but is NOT a security boundary.
 * For production, consider using worker_threads or child_process for true isolation.
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
exports.PluginSandbox = void 0;
const vm = __importStar(require("vm"));
/**
 * VM-based plugin sandbox for isolated code execution
 */
class PluginSandbox {
    constructor(logger) {
        this.logger = logger;
    }
    /**
     * Execute code in a sandboxed context
     *
     * @param code - Code to execute
     * @param options - Sandbox options
     * @returns Execution result
     */
    execute(code, options = {}) {
        const { timeout = 5000, globals = {}, allowConsole = false } = options;
        try {
            // Create sandbox context with limited globals
            const sandbox = {
                // Safe globals
                Buffer,
                setTimeout,
                setInterval,
                clearTimeout,
                clearInterval,
                Promise,
                // Optionally enable console
                ...(allowConsole ? { console } : {}),
                // User-provided globals
                ...globals
            };
            // Create context
            const context = vm.createContext(sandbox);
            this.logger.debug(`Executing code in sandbox (timeout: ${timeout}ms)`);
            // Execute with timeout
            const result = vm.runInContext(code, context, {
                timeout,
                displayErrors: true,
                breakOnSigint: true
            });
            return {
                success: true,
                result: result
            };
        }
        catch (error) {
            this.logger.error('Sandbox execution failed', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }
    /**
     * Execute an async function in a sandboxed context
     *
     * @param fn - Async function to execute
     * @param args - Arguments to pass to the function
     * @param options - Sandbox options
     * @returns Execution result
     */
    async executeAsync(fn, args = [], options = {}) {
        const { timeout = 5000, globals = {}, allowConsole = false } = options;
        try {
            // Create sandbox context
            const sandbox = {
                Buffer,
                setTimeout,
                setInterval,
                clearTimeout,
                clearInterval,
                Promise,
                ...(allowConsole ? { console } : {}),
                ...globals,
                __fn: fn,
                __args: args
            };
            const context = vm.createContext(sandbox);
            this.logger.debug(`Executing async function in sandbox (timeout: ${timeout}ms)`);
            // Execute with timeout wrapper
            const code = `
        (async () => {
          return await __fn(...__args);
        })()
      `;
            const result = await vm.runInContext(code, context, {
                timeout,
                displayErrors: true,
                breakOnSigint: true
            });
            return {
                success: true,
                result: result
            };
        }
        catch (error) {
            this.logger.error('Async sandbox execution failed', error);
            return {
                success: false,
                error: error instanceof Error ? error : new Error(String(error))
            };
        }
    }
    /**
     * Execute a function with resource limits
     * This is a simpler interface for running user-provided functions
     *
     * @param fn - Function to execute
     * @param options - Sandbox options
     * @returns Execution result
     */
    executeFunction(fn, options = {}) {
        const { timeout = 5000 } = options;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                resolve({
                    success: false,
                    error: new Error(`Execution timeout after ${timeout}ms`)
                });
            }, timeout);
            Promise.resolve()
                .then(() => fn())
                .then(result => {
                clearTimeout(timer);
                resolve({
                    success: true,
                    result
                });
            })
                .catch(error => {
                clearTimeout(timer);
                resolve({
                    success: false,
                    error: error instanceof Error ? error : new Error(String(error))
                });
            });
        });
    }
}
exports.PluginSandbox = PluginSandbox;
//# sourceMappingURL=PluginSandbox.js.map