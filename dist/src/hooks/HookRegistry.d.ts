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
 * Hook management system supporting filter chains and broadcasts
 */
export declare class HookRegistry {
    private hooks;
    private logger;
    private nextId;
    constructor(logger: Logger);
    /**
     * Register a hook handler
     *
     * @param hookName - Name of the hook (e.g., 'cli:startup')
     * @param handler - Function to execute when hook fires
     * @param priority - Execution priority (lower = earlier, default 10)
     * @returns Unregister function
     */
    register<T>(hookName: string, handler: HookHandler<T>, priority?: number): () => void;
    /**
     * Unregister a specific hook handler
     *
     * @param hookName - Name of the hook
     * @param id - Handler ID (from registration)
     */
    private unregister;
    /**
     * Trigger a filter hook (sequential pipeline)
     * Each handler receives the output of the previous handler
     *
     * @param hookName - Name of the hook
     * @param initialData - Initial data to pass through the pipeline
     * @returns Final transformed data
     */
    trigger<T>(hookName: string, initialData: T): Promise<T>;
    /**
     * Broadcast an action hook (parallel execution)
     * All handlers run in parallel; their return values are ignored
     *
     * @param hookName - Name of the hook
     * @param data - Data to pass to all handlers
     */
    broadcast<T>(hookName: string, data: T): Promise<void>;
    /**
     * Get all registered hook names
     */
    getHookNames(): string[];
    /**
     * Get the number of handlers for a specific hook
     */
    getHandlerCount(hookName: string): number;
    /**
     * Clear all handlers for a specific hook
     */
    clearHook(hookName: string): void;
    /**
     * Clear all hooks
     */
    clearAll(): void;
}
//# sourceMappingURL=HookRegistry.d.ts.map