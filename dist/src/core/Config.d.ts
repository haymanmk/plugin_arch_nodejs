/**
 * Config Service
 *
 * Namespaced key-value configuration store.
 * Each plugin gets its own namespace to avoid collisions.
 */
/**
 * Simple namespaced configuration store
 * Supports nested keys with dot notation (e.g., 'plugin.setting.value')
 */
export declare class Config {
    private store;
    constructor();
    /**
     * Get a configuration value
     * Returns undefined if not found
     *
     * @param key - Config key (supports dot notation)
     * @param namespace - Optional namespace to prefix the key
     */
    get<T = unknown>(key: string, namespace?: string): T | undefined;
    /**
     * Set a configuration value
     *
     * @param key - Config key (supports dot notation)
     * @param value - Value to store
     * @param namespace - Optional namespace to prefix the key
     */
    set(key: string, value: unknown, namespace?: string): void;
    /**
     * Check if a key exists in the config
     *
     * @param key - Config key to check
     * @param namespace - Optional namespace to prefix the key
     */
    has(key: string, namespace?: string): boolean;
    /**
     * Delete a configuration value
     *
     * @param key - Config key to delete
     * @param namespace - Optional namespace to prefix the key
     */
    delete(key: string, namespace?: string): boolean;
    /**
     * Get all keys in a namespace
     *
     * @param namespace - Namespace to query
     */
    getNamespaceKeys(namespace: string): string[];
    /**
     * Get all values in a namespace
     *
     * @param namespace - Namespace to query
     */
    getNamespace(namespace: string): Record<string, unknown>;
    /**
     * Clear all configuration in a namespace
     *
     * @param namespace - Namespace to clear
     */
    clearNamespace(namespace: string): void;
    /**
     * Clear all configuration
     */
    clear(): void;
    /**
     * Get the total number of config entries
     */
    size(): number;
}
//# sourceMappingURL=Config.d.ts.map