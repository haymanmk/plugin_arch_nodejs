/**
 * HookRegistry Tests
 * 
 * Tests for the hook system covering:
 * - Filter chain (trigger) - sequential data transformation
 * - Action broadcast - parallel execution
 * - Priority ordering (lower numbers run first)
 * - Unregister functionality
 * - Error isolation
 */

import { HookRegistry } from '../src/hooks/HookRegistry';
import { Logger } from '../src/core/Logger';

describe('HookRegistry', () => {
  let registry: HookRegistry;
  let logger: Logger;
  
  beforeEach(() => {
    // Create a fresh registry for each test
    logger = new Logger('test', 'error'); // Set to error to suppress logs during tests
    registry = new HookRegistry(logger);
  });
  
  describe('Filter Hooks (trigger)', () => {
    test('should execute handlers in sequence and transform data', async () => {
      // Register handlers that append to a string
      registry.register<string>('test-filter', (data) => data + ' -> A');
      registry.register<string>('test-filter', (data) => data + ' -> B');
      registry.register<string>('test-filter', (data) => data + ' -> C');
      
      const result = await registry.trigger('test-filter', 'START');
      
      expect(result).toBe('START -> A -> B -> C');
    });
    
    test('should respect priority ordering (lower numbers first)', async () => {
      const executionOrder: number[] = [];
      
      registry.register('priority-test', () => { executionOrder.push(3); }, 30);
      registry.register('priority-test', () => { executionOrder.push(1); }, 10);
      registry.register('priority-test', () => { executionOrder.push(2); }, 20);
      
      await registry.trigger('priority-test', null);
      
      expect(executionOrder).toEqual([1, 2, 3]);
    });
    
    test('should handle async handlers', async () => {
      registry.register<number>('async-filter', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return data * 2;
      });
      
      registry.register<number>('async-filter', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return data + 10;
      });
      
      const result = await registry.trigger('async-filter', 5);
      
      // 5 * 2 = 10, then 10 + 10 = 20
      expect(result).toBe(20);
    });
    
    test('should continue with unchanged data if handler throws', async () => {
      registry.register<string>('error-filter', (data) => data + ' A');
      registry.register<string>('error-filter', () => {
        throw new Error('Handler error');
      });
      registry.register<string>('error-filter', (data) => data + ' C');
      
      const result = await registry.trigger('error-filter', 'START');
      
      // Should be: START A (error skipped) C
      expect(result).toBe('START A C');
    });
    
    test('should return initial data if no handlers registered', async () => {
      const result = await registry.trigger('no-handlers', 'UNCHANGED');
      
      expect(result).toBe('UNCHANGED');
    });
  });
  
  describe('Action Hooks (broadcast)', () => {
    test('should execute all handlers in parallel', async () => {
      const results: string[] = [];
      
      registry.register('broadcast-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        results.push('A');
      });
      
      registry.register('broadcast-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push('B');
      });
      
      registry.register('broadcast-test', async () => {
        results.push('C');
      });
      
      await registry.broadcast('broadcast-test', null);
      
      // B should finish before A due to shorter timeout
      expect(results).toContain('A');
      expect(results).toContain('B');
      expect(results).toContain('C');
      expect(results.length).toBe(3);
    });
    
    test('should isolate errors - one handler error does not affect others', async () => {
      const results: string[] = [];
      
      registry.register('error-broadcast', () => { results.push('A'); });
      registry.register('error-broadcast', () => {
        throw new Error('Handler error');
      });
      registry.register('error-broadcast', () => { results.push('C'); });
      
      await registry.broadcast('error-broadcast', null);
      
      // A and C should still execute despite B throwing
      expect(results).toEqual(['A', 'C']);
    });
    
    test('should not return anything (void)', async () => {
      registry.register('void-test', () => 'This return value is ignored');
      
      const result = await registry.broadcast('void-test', null);
      
      expect(result).toBeUndefined();
    });
  });
  
  describe('Unregister', () => {
    test('should unregister handler using returned function', async () => {
      const results: string[] = [];
      
      registry.register('unregister-test', () => { results.push('A'); });
      const unregisterB = registry.register('unregister-test', () => { results.push('B'); });
      registry.register('unregister-test', () => { results.push('C'); });
      
      // First trigger: all handlers run
      await registry.broadcast('unregister-test', null);
      expect(results).toEqual(['A', 'B', 'C']);
      
      // Unregister B
      results.length = 0;
      unregisterB();
      
      // Second trigger: only A and C run
      await registry.broadcast('unregister-test', null);
      expect(results).toEqual(['A', 'C']);
    });
  });
  
  describe('Metadata', () => {
    test('should return all registered hook names', () => {
      registry.register('hook1', () => {});
      registry.register('hook2', () => {});
      registry.register('hook3', () => {});
      
      const hookNames = registry.getHookNames();
      
      expect(hookNames).toContain('hook1');
      expect(hookNames).toContain('hook2');
      expect(hookNames).toContain('hook3');
    });
    
    test('should return handler count for a hook', () => {
      registry.register('count-test', () => {});
      registry.register('count-test', () => {});
      registry.register('count-test', () => {});
      
      const count = registry.getHandlerCount('count-test');
      
      expect(count).toBe(3);
    });
    
    test('should return 0 for non-existent hook', () => {
      const count = registry.getHandlerCount('does-not-exist');
      
      expect(count).toBe(0);
    });
  });
  
  describe('Clear', () => {
    test('should clear specific hook', async () => {
      const results: string[] = [];
      
      registry.register('clear-test', () => { results.push('A'); });
      registry.register('clear-test', () => { results.push('B'); });
      
      registry.clearHook('clear-test');
      
      await registry.broadcast('clear-test', null);
      
      expect(results).toEqual([]);
    });
    
    test('should clear all hooks', () => {
      registry.register('hook1', () => {});
      registry.register('hook2', () => {});
      registry.register('hook3', () => {});
      
      registry.clearAll();
      
      expect(registry.getHookNames()).toEqual([]);
    });
  });
});
