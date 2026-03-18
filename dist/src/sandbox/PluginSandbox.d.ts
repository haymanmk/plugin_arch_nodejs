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
import { Logger } from '../core/Logger';
/**
 * Options for sandbox execution
 */
export interface SandboxOptions {
    /** Execution timeout in milliseconds (default: 5000) */
    timeout?: number;
    /** Additional globals to expose in the sandbox */
    globals?: Record<string, unknown>;
    /** Enable console access (default: false) */
    allowConsole?: boolean;
}
/**
 * Result of sandbox execution
 */
export interface SandboxResult<T = unknown> {
    success: boolean;
    result?: T;
    error?: Error;
}
/**
 * VM-based plugin sandbox for isolated code execution
 */
export declare class PluginSandbox {
    private logger;
    constructor(logger: Logger);
    /**
     * Execute code in a sandboxed context
     *
     * @param code - Code to execute
     * @param options - Sandbox options
     * @returns Execution result
     */
    execute<T = unknown>(code: string, options?: SandboxOptions): SandboxResult<T>;
    /**
     * Execute an async function in a sandboxed context
     *
     * @param fn - Async function to execute
     * @param args - Arguments to pass to the function
     * @param options - Sandbox options
     * @returns Execution result
     */
    executeAsync<T = unknown>(fn: (...args: unknown[]) => Promise<T>, args?: unknown[], options?: SandboxOptions): Promise<SandboxResult<T>>;
    /**
     * Execute a function with resource limits
     * This is a simpler interface for running user-provided functions
     *
     * @param fn - Function to execute
     * @param options - Sandbox options
     * @returns Execution result
     */
    executeFunction<T = unknown>(fn: () => T | Promise<T>, options?: SandboxOptions): Promise<SandboxResult<T>>;
}
//# sourceMappingURL=PluginSandbox.d.ts.map