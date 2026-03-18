"use strict";
/**
 * Message Bus
 *
 * Provides pub/sub messaging for inter-plugin communication.
 * Subscribers are isolated - errors in one subscriber don't affect others.
 * Returns unsubscribe functions for cleanup.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBus = void 0;
/**
 * Simple pub/sub message bus with error isolation
 */
class MessageBus {
    constructor(logger) {
        this.subscriptions = new Map();
        this.logger = logger;
        this.nextId = 1;
    }
    /**
     * Subscribe to a message topic
     *
     * @param topic - Message topic (e.g., 'command:executed')
     * @param handler - Function to call when message is published
     * @returns Unsubscribe function
     */
    subscribe(topic, handler) {
        if (!this.subscriptions.has(topic)) {
            this.subscriptions.set(topic, []);
        }
        const id = `sub-${this.nextId++}`;
        const subscription = { handler, id };
        this.subscriptions.get(topic).push(subscription);
        this.logger.debug(`Subscribed to topic "${topic}" (id: ${id})`);
        // Return unsubscribe function
        return () => this.unsubscribe(topic, id);
    }
    /**
     * Unsubscribe from a message topic
     *
     * @param topic - Message topic
     * @param id - Subscription ID
     */
    unsubscribe(topic, id) {
        const subs = this.subscriptions.get(topic);
        if (!subs) {
            return;
        }
        const index = subs.findIndex(sub => sub.id === id);
        if (index !== -1) {
            subs.splice(index, 1);
            this.logger.debug(`Unsubscribed from topic "${topic}" (id: ${id})`);
        }
        // Clean up empty topic entries
        if (subs.length === 0) {
            this.subscriptions.delete(topic);
        }
    }
    /**
     * Publish a message to all subscribers of a topic
     * Errors in subscribers are isolated and logged
     *
     * @param topic - Message topic
     * @param data - Data to send to subscribers
     */
    async publish(topic, data) {
        const subs = this.subscriptions.get(topic);
        if (!subs || subs.length === 0) {
            this.logger.debug(`Published to topic "${topic}" (no subscribers)`);
            return;
        }
        this.logger.debug(`Publishing to topic "${topic}" (${subs.length} subscribers)`);
        // Execute all handlers in parallel with error isolation
        await Promise.allSettled(subs.map(async (sub) => {
            try {
                await sub.handler(data);
            }
            catch (error) {
                this.logger.error(`Error in subscriber for topic "${topic}" (id: ${sub.id})`, error);
            }
        }));
    }
    /**
     * Publish synchronously (fire and forget, no await)
     * Useful when you don't want to block on subscriber execution
     *
     * @param topic - Message topic
     * @param data - Data to send to subscribers
     */
    publishSync(topic, data) {
        const subs = this.subscriptions.get(topic);
        if (!subs || subs.length === 0) {
            this.logger.debug(`Published (sync) to topic "${topic}" (no subscribers)`);
            return;
        }
        this.logger.debug(`Publishing (sync) to topic "${topic}" (${subs.length} subscribers)`);
        // Fire all handlers without waiting
        for (const sub of subs) {
            Promise.resolve()
                .then(() => sub.handler(data))
                .catch(error => {
                this.logger.error(`Error in subscriber for topic "${topic}" (id: ${sub.id})`, error);
            });
        }
    }
    /**
     * Get all registered topic names
     */
    getTopics() {
        return Array.from(this.subscriptions.keys());
    }
    /**
     * Get the number of subscribers for a specific topic
     */
    getSubscriberCount(topic) {
        return this.subscriptions.get(topic)?.length ?? 0;
    }
    /**
     * Clear all subscriptions for a specific topic
     */
    clearTopic(topic) {
        this.subscriptions.delete(topic);
        this.logger.debug(`Cleared all subscriptions for topic "${topic}"`);
    }
    /**
     * Clear all subscriptions
     */
    clearAll() {
        this.subscriptions.clear();
        this.logger.debug('Cleared all subscriptions');
    }
}
exports.MessageBus = MessageBus;
//# sourceMappingURL=MessageBus.js.map