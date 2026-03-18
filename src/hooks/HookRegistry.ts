/**
 * Hook Registry
 * 
 * Manages two types of hooks:
 * 1. Filter hooks (trigger) - Sequential pipeline where each handler can modify data
 * 2. Action hooks (broadcast) - Parallel execution where handlers just observe events
 * 
 * Both support priority ordering (lower numbers run first).
 */

import { Logger } from '../core/Logger';

/**
 * Hook handler function signature
 * - For filters: receives data and returns modified data
 * - For actions: receives data but return value is ignored
 */
export type HookHandler<T = unknown> = (data: T) => T | Promise<T>;

/**
 * Hook registration entry with priority
 */
interface HookEntry<T> {
  handler: HookHandler<T>;
  priority: number;
  id: string; // unique identifier for unregistering
}

/**
 * Hook management system supporting filter chains and broadcasts
 */
export class HookRegistry {
  private hooks: Map<string, HookEntry<unknown>[]>;
  private logger: Logger;
  private nextId: number;
  
  constructor(logger: Logger) {
    this.hooks = new Map();
    this.logger = logger;
    this.nextId = 1;
  }
  
  /**
   * Register a hook handler
   * 
   * @param hookName - Name of the hook (e.g., 'cli:startup')
   * @param handler - Function to execute when hook fires
   * @param priority - Execution priority (lower = earlier, default 10)
   * @returns Unregister function
   */
  register<T>(
    hookName: string,
    handler: HookHandler<T>,
    priority: number = 10
  ): () => void {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    const id = `hook-${this.nextId++}`;
    const entry: HookEntry<T> = { handler, priority, id };
    
    const handlers = this.hooks.get(hookName)!;
    handlers.push(entry as HookEntry<unknown>);
    
    // Sort by priority (lower numbers first)
    handlers.sort((a, b) => a.priority - b.priority);
    
    this.logger.debug(`Registered hook "${hookName}" (priority: ${priority}, id: ${id})`);
    
    // Return unregister function
    return () => this.unregister(hookName, id);
  }
  
  /**
   * Unregister a specific hook handler
   * 
   * @param hookName - Name of the hook
   * @param id - Handler ID (from registration)
   */
  private unregister(hookName: string, id: string): void {
    const handlers = this.hooks.get(hookName);
    if (!handlers) {
      return;
    }
    
    const index = handlers.findIndex(entry => entry.id === id);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.logger.debug(`Unregistered hook "${hookName}" (id: ${id})`);
    }
  }
  
  /**
   * Trigger a filter hook (sequential pipeline)
   * Each handler receives the output of the previous handler
   * 
   * @param hookName - Name of the hook
   * @param initialData - Initial data to pass through the pipeline
   * @returns Final transformed data
   */
  async trigger<T>(hookName: string, initialData: T): Promise<T> {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) {
      this.logger.debug(`Hook "${hookName}" triggered (no handlers)`);
      return initialData;
    }
    
    this.logger.debug(`Triggering filter hook "${hookName}" (${handlers.length} handlers)`);
    
    let data = initialData;
    
    for (const entry of handlers) {
      try {
        const result = await entry.handler(data);
        data = result as T;
      } catch (error) {
        this.logger.error(
          `Error in hook "${hookName}" (id: ${entry.id})`,
          error
        );
        // Continue with unchanged data on error
      }
    }
    
    return data;
  }
  
  /**
   * Broadcast an action hook (parallel execution)
   * All handlers run in parallel; their return values are ignored
   * 
   * @param hookName - Name of the hook
   * @param data - Data to pass to all handlers
   */
  async broadcast<T>(hookName: string, data: T): Promise<void> {
    const handlers = this.hooks.get(hookName);
    if (!handlers || handlers.length === 0) {
      this.logger.debug(`Hook "${hookName}" broadcast (no handlers)`);
      return;
    }
    
    this.logger.debug(`Broadcasting hook "${hookName}" (${handlers.length} handlers)`);
    
    // Execute all handlers in parallel with error isolation
    await Promise.allSettled(
      handlers.map(async entry => {
        try {
          await entry.handler(data);
        } catch (error) {
          this.logger.error(
            `Error in hook "${hookName}" (id: ${entry.id})`,
            error
          );
        }
      })
    );
  }
  
  /**
   * Get all registered hook names
   */
  getHookNames(): string[] {
    return Array.from(this.hooks.keys());
  }
  
  /**
   * Get the number of handlers for a specific hook
   */
  getHandlerCount(hookName: string): number {
    return this.hooks.get(hookName)?.length ?? 0;
  }
  
  /**
   * Clear all handlers for a specific hook
   */
  clearHook(hookName: string): void {
    this.hooks.delete(hookName);
    this.logger.debug(`Cleared all handlers for hook "${hookName}"`);
  }
  
  /**
   * Clear all hooks
   */
  clearAll(): void {
    this.hooks.clear();
    this.logger.debug('Cleared all hooks');
  }
}
