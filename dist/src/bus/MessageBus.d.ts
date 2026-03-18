/**
 * Message Bus
 *
 * Provides pub/sub messaging for inter-plugin communication.
 * Subscribers are isolated - errors in one subscriber don't affect others.
 * Returns unsubscribe functions for cleanup.
 */
import { Logger } from '../core/Logger';
/**
 * Message handler function signature
 */
export type MessageHandler<T = unknown> = (data: T) => void | Promise<void>;
/**
 * Simple pub/sub message bus with error isolation
 */
export declare class MessageBus {
    private subscriptions;
    private logger;
    private nextId;
    constructor(logger: Logger);
    /**
     * Subscribe to a message topic
     *
     * @param topic - Message topic (e.g., 'command:executed')
     * @param handler - Function to call when message is published
     * @returns Unsubscribe function
     */
    subscribe<T>(topic: string, handler: MessageHandler<T>): () => void;
    /**
     * Unsubscribe from a message topic
     *
     * @param topic - Message topic
     * @param id - Subscription ID
     */
    private unsubscribe;
    /**
     * Publish a message to all subscribers of a topic
     * Errors in subscribers are isolated and logged
     *
     * @param topic - Message topic
     * @param data - Data to send to subscribers
     */
    publish<T>(topic: string, data: T): Promise<void>;
    /**
     * Publish synchronously (fire and forget, no await)
     * Useful when you don't want to block on subscriber execution
     *
     * @param topic - Message topic
     * @param data - Data to send to subscribers
     */
    publishSync<T>(topic: string, data: T): void;
    /**
     * Get all registered topic names
     */
    getTopics(): string[];
    /**
     * Get the number of subscribers for a specific topic
     */
    getSubscriberCount(topic: string): number;
    /**
     * Clear all subscriptions for a specific topic
     */
    clearTopic(topic: string): void;
    /**
     * Clear all subscriptions
     */
    clearAll(): void;
}
//# sourceMappingURL=MessageBus.d.ts.map