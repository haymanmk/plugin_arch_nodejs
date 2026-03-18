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
export declare class ServiceContainer {
    private services;
    private factories;
    constructor();
    /**
     * Register a service instance (singleton)
     *
     * @param name - Service identifier
     * @param instance - Service instance
     */
    register<T>(name: string, instance: T): void;
    /**
     * Register a service factory (creates instance on first get)
     *
     * @param name - Service identifier
     * @param factory - Factory function
     */
    registerFactory<T>(name: string, factory: ServiceFactory<T>): void;
    /**
     * Get a service by name
     * If it's a factory, creates the instance on first access (lazy singleton)
     *
     * @param name - Service identifier
     * @throws Error if service not found
     */
    get<T>(name: string): T;
    /**
     * Check if a service is registered
     *
     * @param name - Service identifier
     */
    has(name: string): boolean;
    /**
     * Unregister a service
     *
     * @param name - Service identifier
     */
    unregister(name: string): boolean;
    /**
     * Get all registered service names
     */
    getServiceNames(): string[];
    /**
     * Clear all services
     */
    clear(): void;
}
//# sourceMappingURL=ServiceContainer.d.ts.map