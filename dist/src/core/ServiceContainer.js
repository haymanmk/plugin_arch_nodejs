"use strict";
/**
 * Service Container
 *
 * Simple dependency injection container for shared services.
 * Plugins can register services and retrieve them by name.
 * Supports both singleton instances and factory functions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceContainer = void 0;
/**
 * Simple DI container for managing shared services
 */
class ServiceContainer {
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
    register(name, instance) {
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
    registerFactory(name, factory) {
        if (this.services.has(name) || this.factories.has(name)) {
            throw new Error(`Service "${name}" is already registered`);
        }
        this.factories.set(name, factory);
    }
    /**
     * Get a service by name
     * If it's a factory, creates the instance on first access (lazy singleton)
     *
     * @param name - Service identifier
     * @throws Error if service not found
     */
    get(name) {
        // Check if we have an instance
        if (this.services.has(name)) {
            return this.services.get(name);
        }
        // Check if we have a factory
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const instance = factory();
            // Cache the instance (convert factory to singleton)
            this.services.set(name, instance);
            this.factories.delete(name);
            return instance;
        }
        throw new Error(`Service "${name}" not found`);
    }
    /**
     * Check if a service is registered
     *
     * @param name - Service identifier
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }
    /**
     * Unregister a service
     *
     * @param name - Service identifier
     */
    unregister(name) {
        const hadService = this.services.delete(name);
        const hadFactory = this.factories.delete(name);
        return hadService || hadFactory;
    }
    /**
     * Get all registered service names
     */
    getServiceNames() {
        return [
            ...Array.from(this.services.keys()),
            ...Array.from(this.factories.keys())
        ];
    }
    /**
     * Clear all services
     */
    clear() {
        this.services.clear();
        this.factories.clear();
    }
}
exports.ServiceContainer = ServiceContainer;
//# sourceMappingURL=ServiceContainer.js.map