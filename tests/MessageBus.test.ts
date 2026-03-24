/**
 * MessageBus Tests
 * 
 * Tests for the pub/sub message bus covering:
 * - Subscribe/publish pattern
 * - Error isolation (one subscriber error doesn't affect others)
 * - Unsubscribe functionality
 * - Multiple subscribers per topic
 * - Async and sync message handling
 */

import { MessageBus } from '../src/bus/MessageBus';
import { Logger } from '../src/core/Logger';

describe('MessageBus', () => {
  let bus: MessageBus;
  let logger: Logger;
  
  beforeEach(() => {
    // Create a fresh bus for each test
    logger = new Logger('test', 'error'); // Set to error to suppress logs during tests
    bus = new MessageBus(logger);
  });
  
  describe('Subscribe and Publish', () => {
    test('should deliver message to subscriber', async () => {
      let received: string | null = null;
      
      bus.subscribe<string>('test-topic', (data) => {
        received = data;
      });
      
      await bus.publish('test-topic', 'Hello World');
      
      expect(received).toBe('Hello World');
    });
    
    test('should deliver to multiple subscribers', async () => {
      const results: string[] = [];
      
      bus.subscribe<string>('multi-topic', (data) => {
        results.push(`A: ${data}`);
      });
      
      bus.subscribe<string>('multi-topic', (data) => {
        results.push(`B: ${data}`);
      });
      
      bus.subscribe<string>('multi-topic', (data) => {
        results.push(`C: ${data}`);
      });
      
      await bus.publish('multi-topic', 'test');
      
      expect(results).toEqual(['A: test', 'B: test', 'C: test']);
    });
    
    test('should handle async subscribers', async () => {
      const results: string[] = [];
      
      bus.subscribe<string>('async-topic', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push(`Async: ${data}`);
      });
      
      await bus.publish('async-topic', 'delayed');
      
      expect(results).toEqual(['Async: delayed']);
    });
    
    test('should not deliver to wrong topic', async () => {
      let received: string | null = null;
      
      bus.subscribe<string>('topic-a', (data) => {
        received = data;
      });
      
      await bus.publish('topic-b', 'Wrong topic');
      
      expect(received).toBeNull();
    });
    
    test('should handle complex data types', async () => {
      interface TestData {
        id: number;
        name: string;
        nested: { value: boolean };
      }
      
      let received: TestData | null = null;
      
      bus.subscribe<TestData>('complex-topic', (data) => {
        received = data;
      });
      
      const testData: TestData = {
        id: 42,
        name: 'test',
        nested: { value: true }
      };
      
      await bus.publish('complex-topic', testData);
      
      expect(received).toEqual(testData);
    });
  });
  
  describe('Error Isolation', () => {
    test('should isolate errors - one subscriber error does not affect others', async () => {
      const results: string[] = [];
      
      bus.subscribe('error-topic', () => {
        results.push('A');
      });
      
      bus.subscribe('error-topic', () => {
        throw new Error('Subscriber error');
      });
      
      bus.subscribe('error-topic', () => {
        results.push('C');
      });
      
      await bus.publish('error-topic', null);
      
      // A and C should still execute despite B throwing
      expect(results).toEqual(['A', 'C']);
    });
    
    test('should handle async errors', async () => {
      const results: string[] = [];
      
      bus.subscribe('async-error-topic', async () => {
        results.push('A');
      });
      
      bus.subscribe('async-error-topic', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      });
      
      bus.subscribe('async-error-topic', async () => {
        results.push('C');
      });
      
      await bus.publish('async-error-topic', null);
      
      expect(results).toEqual(['A', 'C']);
    });
  });
  
  describe('Unsubscribe', () => {
    test('should unsubscribe using returned function', async () => {
      const results: string[] = [];
      
      bus.subscribe('unsub-topic', () => { results.push('A'); });
      const unsubscribeB = bus.subscribe('unsub-topic', () => { results.push('B'); });
      bus.subscribe('unsub-topic', () => { results.push('C'); });
      
      // First publish: all subscribers receive
      await bus.publish('unsub-topic', null);
      expect(results).toEqual(['A', 'B', 'C']);
      
      // Unsubscribe B
      results.length = 0;
      unsubscribeB();
      
      // Second publish: only A and C receive
      await bus.publish('unsub-topic', null);
      expect(results).toEqual(['A', 'C']);
    });
    
    test('should handle unsubscribe of non-existent subscription gracefully', () => {
      const unsubscribe = bus.subscribe('topic', () => {});
      
      unsubscribe(); // First call
      unsubscribe(); // Second call should not throw
      
      // No assertion needed - just checking it doesn't throw
    });
  });
  
  describe('publishSync (Fire and Forget)', () => {
    test('should publish without waiting for subscribers', () => {
      let received: string | null = null;
      
      bus.subscribe<string>('sync-topic', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        received = data;
      });
      
      // publishSync returns immediately
      bus.publishSync('sync-topic', 'test');
      
      // Subscriber hasn't finished yet
      expect(received).toBeNull();
      
      // Wait for subscriber to complete
      return new Promise<void>(resolve => {
        setTimeout(() => {
          expect(received).toBe('test');
          resolve();
        }, 100);
      });
    });
  });
  
  describe('Metadata', () => {
    test('should return all topic names', () => {
      bus.subscribe('topic1', () => {});
      bus.subscribe('topic2', () => {});
      bus.subscribe('topic3', () => {});
      
      const topics = bus.getTopics();
      
      expect(topics).toContain('topic1');
      expect(topics).toContain('topic2');
      expect(topics).toContain('topic3');
    });
    
    test('should return subscriber count for a topic', () => {
      bus.subscribe('count-topic', () => {});
      bus.subscribe('count-topic', () => {});
      bus.subscribe('count-topic', () => {});
      
      const count = bus.getSubscriberCount('count-topic');
      
      expect(count).toBe(3);
    });
    
    test('should return 0 for non-existent topic', () => {
      const count = bus.getSubscriberCount('does-not-exist');
      
      expect(count).toBe(0);
    });
    
    test('should clean up topic when all subscribers unsubscribe', () => {
      const unsub1 = bus.subscribe('cleanup-topic', () => {});
      const unsub2 = bus.subscribe('cleanup-topic', () => {});
      
      expect(bus.getSubscriberCount('cleanup-topic')).toBe(2);
      
      unsub1();
      expect(bus.getSubscriberCount('cleanup-topic')).toBe(1);
      
      unsub2();
      expect(bus.getSubscriberCount('cleanup-topic')).toBe(0);
      expect(bus.getTopics()).not.toContain('cleanup-topic');
    });
  });
  
  describe('Clear', () => {
    test('should clear specific topic', async () => {
      const results: string[] = [];
      
      bus.subscribe('clear-topic', () => { results.push('A'); });
      bus.subscribe('clear-topic', () => { results.push('B'); });
      
      bus.clearTopic('clear-topic');
      
      await bus.publish('clear-topic', null);
      
      expect(results).toEqual([]);
    });
    
    test('should clear all subscriptions', () => {
      bus.subscribe('topic1', () => {});
      bus.subscribe('topic2', () => {});
      bus.subscribe('topic3', () => {});
      
      bus.clearAll();
      
      expect(bus.getTopics()).toEqual([]);
    });
  });
});
