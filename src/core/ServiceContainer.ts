/**
 * Service Container
 * 
 * Simple dependency injection container for shared services.
 * Plugins can register services and retrieve them by name.
 * Supports both singleton instances and factory functions.
 */

/**
 * Factory function that produces a service instance
 */
export type ServiceFactory<T> = () => T;

/**
 * Service can be an instance or a factory function
 */
export type Service<T> = T | ServiceFactory<T>;

/**
 * Simple DI container for managing shared services
 */
export class ServiceContainer {
  private services: Map<string, unknown>;
  private factories: Map<string, ServiceFactory<unknown>>;
  
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }
  
  /**
   * Register a service instance (singleton)
   * 
   * @param name - Service identifier
   * @param instance - Service instance
   */
  register<T>(name: string, instance: T): void {
    if (this.services.has(name) || this.factories.has(name)) {
      throw new Error(`Service "${name}" is already registered`);
    }
    this.services.set(name, instance);
  }
  
  /**
   * Register a service factory (creates instance on first get)
   * 
   * @param name - Service identifier
   * @param factory - Factory function
   */
  registerFactory<T>(name: string, factory: ServiceFactory<T>): void {
    if (this.services.has(name) || this.factories.has(name)) {
      throw new Error(`Service "${name}" is already registered`);
    }
    this.factories.set(name, factory as ServiceFactory<unknown>);
  }
  
  /**
   * Get a service by name
   * If it's a factory, creates the instance on first access (lazy singleton)
   * 
   * @param name - Service identifier
   * @throws Error if service not found
   */
  get<T>(name: string): T {
    // Check if we have an instance
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }
    
    // Check if we have a factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      const instance = factory();
      
      // Cache the instance (convert factory to singleton)
      this.services.set(name, instance);
      this.factories.delete(name);
      
      return instance as T;
    }
    
    throw new Error(`Service "${name}" not found`);
  }
  
  /**
   * Check if a service is registered
   * 
   * @param name - Service identifier
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }
  
  /**
   * Unregister a service
   * 
   * @param name - Service identifier
   */
  unregister(name: string): boolean {
    const hadService = this.services.delete(name);
    const hadFactory = this.factories.delete(name);
    return hadService || hadFactory;
  }
  
  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return [
      ...Array.from(this.services.keys()),
      ...Array.from(this.factories.keys())
    ];
  }
  
  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}
