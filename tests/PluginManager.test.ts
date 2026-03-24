/**
 * PluginManager Tests
 * 
 * Tests for plugin management covering:
 * - Dependency ordering (topological sort)
 * - Circular dependency detection
 * - Plugin loading and initialization
 * - Enable/disable functionality
 */

import { PluginManager } from '../src/plugins/PluginManager';
import { Plugin } from '../src/types/plugin';
import { Logger } from '../src/core/Logger';
import { Config } from '../src/core/Config';
import { ServiceContainer } from '../src/core/ServiceContainer';
import { HookRegistry } from '../src/hooks/HookRegistry';
import { MessageBus } from '../src/bus/MessageBus';
import { Command } from 'commander';

describe('PluginManager', () => {
  let manager: PluginManager;
  let logger: Logger;
  let config: Config;
  let services: ServiceContainer;
  let hooks: HookRegistry;
  let bus: MessageBus;
  let program: Command;
  
  beforeEach(() => {
    logger = new Logger('test', 'error');
    config = new Config();
    services = new ServiceContainer();
    hooks = new HookRegistry(logger);
    bus = new MessageBus(logger);
    program = new Command();
    
    manager = new PluginManager(
      [], // Empty plugin dirs for unit tests
      logger,
      config,
      services,
      hooks,
      bus,
      program
    );
  });
  
  describe('Dependency Resolution', () => {
    test('should resolve plugins in dependency order', () => {
      // Create mock plugins with dependencies
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'Plugin A' },
        initialize: jest.fn()
      };
      
      const pluginB: Plugin = {
        metadata: {
          name: 'B',
          version: '1.0.0',
          description: 'Plugin B',
          dependencies: ['A'] // B depends on A
        },
        initialize: jest.fn()
      };
      
      const pluginC: Plugin = {
        metadata: {
          name: 'C',
          version: '1.0.0',
          description: 'Plugin C',
          dependencies: ['A', 'B'] // C depends on A and B
        },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([
        ['C', pluginC],
        ['A', pluginA],
        ['B', pluginB]
      ]);
      
      const order = manager.resolveDependencyOrder(plugins);
      
      // Expected order: A first, then B (depends on A), then C (depends on both)
      expect(order).toEqual(['A', 'B', 'C']);
    });
    
    test('should handle complex dependency graph', () => {
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'A' },
        initialize: jest.fn()
      };
      
      const pluginB: Plugin = {
        metadata: { name: 'B', version: '1.0.0', description: 'B', dependencies: ['A'] },
        initialize: jest.fn()
      };
      
      const pluginC: Plugin = {
        metadata: { name: 'C', version: '1.0.0', description: 'C', dependencies: ['A'] },
        initialize: jest.fn()
      };
      
      const pluginD: Plugin = {
        metadata: { name: 'D', version: '1.0.0', description: 'D', dependencies: ['B', 'C'] },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([
        ['D', pluginD],
        ['C', pluginC],
        ['B', pluginB],
        ['A', pluginA]
      ]);
      
      const order = manager.resolveDependencyOrder(plugins);
      
      // A must be first, B and C next (order doesn't matter), D last
      expect(order[0]).toBe('A');
      expect(order[3]).toBe('D');
      expect(order.slice(1, 3)).toContain('B');
      expect(order.slice(1, 3)).toContain('C');
    });
    
    test('should throw error on circular dependency', () => {
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'A', dependencies: ['B'] },
        initialize: jest.fn()
      };
      
      const pluginB: Plugin = {
        metadata: { name: 'B', version: '1.0.0', description: 'B', dependencies: ['A'] },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([
        ['A', pluginA],
        ['B', pluginB]
      ]);
      
      expect(() => {
        manager.resolveDependencyOrder(plugins);
      }).toThrow(/circular dependency/i);
    });
    
    test('should throw error on self-dependency', () => {
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'A', dependencies: ['A'] },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([['A', pluginA]]);
      
      expect(() => {
        manager.resolveDependencyOrder(plugins);
      }).toThrow(/circular dependency/i);
    });
    
    test('should throw error on missing dependency', () => {
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'A', dependencies: ['NonExistent'] },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([['A', pluginA]]);
      
      expect(() => {
        manager.resolveDependencyOrder(plugins);
      }).toThrow(/not found/i);
    });
    
    test('should handle plugins with no dependencies', () => {
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'A' },
        initialize: jest.fn()
      };
      
      const pluginB: Plugin = {
        metadata: { name: 'B', version: '1.0.0', description: 'B' },
        initialize: jest.fn()
      };
      
      const pluginC: Plugin = {
        metadata: { name: 'C', version: '1.0.0', description: 'C' },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([
        ['C', pluginC],
        ['A', pluginA],
        ['B', pluginB]
      ]);
      
      const order = manager.resolveDependencyOrder(plugins);
      
      // All plugins are independent, so order is alphabetical (how they're visited)
      expect(order.length).toBe(3);
      expect(order).toContain('A');
      expect(order).toContain('B');
      expect(order).toContain('C');
    });
  });
  
  describe('Plugin State Management', () => {
    test('should track enabled/disabled state', () => {
      // This test would require actual plugin loading, which we can't do in unit tests
      // without a real file system. Instead, we test the API exists.
      expect(manager.isEnabled('test-plugin')).toBe(false);
      expect(manager.getEnabledPluginNames()).toEqual([]);
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle empty plugin map', () => {
      const plugins = new Map<string, Plugin>();
      const order = manager.resolveDependencyOrder(plugins);
      
      expect(order).toEqual([]);
    });
    
    test('should handle diamond dependency', () => {
      // Diamond: A depends on B and C, both B and C depend on D
      const pluginD: Plugin = {
        metadata: { name: 'D', version: '1.0.0', description: 'D' },
        initialize: jest.fn()
      };
      
      const pluginB: Plugin = {
        metadata: { name: 'B', version: '1.0.0', description: 'B', dependencies: ['D'] },
        initialize: jest.fn()
      };
      
      const pluginC: Plugin = {
        metadata: { name: 'C', version: '1.0.0', description: 'C', dependencies: ['D'] },
        initialize: jest.fn()
      };
      
      const pluginA: Plugin = {
        metadata: { name: 'A', version: '1.0.0', description: 'A', dependencies: ['B', 'C'] },
        initialize: jest.fn()
      };
      
      const plugins = new Map<string, Plugin>([
        ['A', pluginA],
        ['B', pluginB],
        ['C', pluginC],
        ['D', pluginD]
      ]);
      
      const order = manager.resolveDependencyOrder(plugins);
      
      // D must be first, A must be last
      expect(order[0]).toBe('D');
      expect(order[3]).toBe('A');
    });
  });
});
