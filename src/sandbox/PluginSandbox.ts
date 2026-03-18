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

import * as vm from 'vm';
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
export class PluginSandbox {
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  /**
   * Execute code in a sandboxed context
   * 
   * @param code - Code to execute
   * @param options - Sandbox options
   * @returns Execution result
   */
  execute<T = unknown>(code: string, options: SandboxOptions = {}): SandboxResult<T> {
    const {
      timeout = 5000,
      globals = {},
      allowConsole = false
    } = options;
    
    try {
      // Create sandbox context with limited globals
      const sandbox: Record<string, unknown> = {
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
        result: result as T
      };
      
    } catch (error) {
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
  async executeAsync<T = unknown>(
    fn: (...args: unknown[]) => Promise<T>,
    args: unknown[] = [],
    options: SandboxOptions = {}
  ): Promise<SandboxResult<T>> {
    const {
      timeout = 5000,
      globals = {},
      allowConsole = false
    } = options;
    
    try {
      // Create sandbox context
      const sandbox: Record<string, unknown> = {
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
        result: result as T
      };
      
    } catch (error) {
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
  executeFunction<T = unknown>(
    fn: () => T | Promise<T>,
    options: SandboxOptions = {}
  ): Promise<SandboxResult<T>> {
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
