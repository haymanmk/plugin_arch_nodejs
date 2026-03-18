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
export class Config {
  private store: Map<string, unknown>;
  
  constructor() {
    this.store = new Map();
  }
  
  /**
   * Get a configuration value
   * Returns undefined if not found
   * 
   * @param key - Config key (supports dot notation)
   * @param namespace - Optional namespace to prefix the key
   */
  get<T = unknown>(key: string, namespace?: string): T | undefined {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return this.store.get(fullKey) as T | undefined;
  }
  
  /**
   * Set a configuration value
   * 
   * @param key - Config key (supports dot notation)
   * @param value - Value to store
   * @param namespace - Optional namespace to prefix the key
   */
  set(key: string, value: unknown, namespace?: string): void {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    this.store.set(fullKey, value);
  }
  
  /**
   * Check if a key exists in the config
   * 
   * @param key - Config key to check
   * @param namespace - Optional namespace to prefix the key
   */
  has(key: string, namespace?: string): boolean {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return this.store.has(fullKey);
  }
  
  /**
   * Delete a configuration value
   * 
   * @param key - Config key to delete
   * @param namespace - Optional namespace to prefix the key
   */
  delete(key: string, namespace?: string): boolean {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return this.store.delete(fullKey);
  }
  
  /**
   * Get all keys in a namespace
   * 
   * @param namespace - Namespace to query
   */
  getNamespaceKeys(namespace: string): string[] {
    const prefix = `${namespace}.`;
    const keys: string[] = [];
    
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length));
      }
    }
    
    return keys;
  }
  
  /**
   * Get all values in a namespace
   * 
   * @param namespace - Namespace to query
   */
  getNamespace(namespace: string): Record<string, unknown> {
    const prefix = `${namespace}.`;
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        result[key.substring(prefix.length)] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Clear all configuration in a namespace
   * 
   * @param namespace - Namespace to clear
   */
  clearNamespace(namespace: string): void {
    const prefix = `${namespace}.`;
    const keysToDelete: string[] = [];
    
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.store.delete(key);
    }
  }
  
  /**
   * Clear all configuration
   */
  clear(): void {
    this.store.clear();
  }
  
  /**
   * Get the total number of config entries
   */
  size(): number {
    return this.store.size;
  }
}
