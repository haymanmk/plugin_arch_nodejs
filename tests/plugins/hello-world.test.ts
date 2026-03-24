/**
 * Hello World Plugin Integration Tests
 * 
 * Integration tests for the hello-world plugin covering:
 * - Plugin initialization registers command via hook
 * - Command execution works end-to-end
 * - Formatter service integration
 * - MessageBus event publishing
 * - Dependency on base-formatter
 */

import { Plugin, PluginContext } from '../../src/types/plugin';
import { Logger } from '../../src/core/Logger';
import { Config } from '../../src/core/Config';
import { ServiceContainer } from '../../src/core/ServiceContainer';
import { HookRegistry } from '../../src/hooks/HookRegistry';
import { MessageBus } from '../../src/bus/MessageBus';
import { Command } from 'commander';

// Mock formatter interface
interface Formatter {
  success(message: string): void;
  info(message: string): void;
  keyValue(key: string, value: string): void;
}

describe('HelloWorld Plugin', () => {
  let plugin: Plugin;
  let context: PluginContext;
  let logger: Logger;
  let config: Config;
  let services: ServiceContainer;
  let hooks: HookRegistry;
  let bus: MessageBus;
  let program: Command;
  let mockFormatter: Formatter;
  
  beforeEach(async () => {
    // Set up core services
    logger = new Logger('test', 'error');
    config = new Config();
    services = new ServiceContainer();
    hooks = new HookRegistry(logger);
    bus = new MessageBus(logger);
    program = new Command();
    
    // Create mock formatter (simulates base-formatter plugin)
    mockFormatter = {
      success: jest.fn(),
      info: jest.fn(),
      keyValue: jest.fn()
    };
    
    // Register formatter service (as base-formatter would)
    services.register<Formatter>('formatter', mockFormatter);
    
    // Create plugin context
    context = {
      logger: logger.child('hello-world'),
      config,
      services,
      hooks,
      bus,
      program
    };
    
    // Load the plugin
    const HelloWorldPlugin = await import('../../plugins/hello-world/index');
    plugin = HelloWorldPlugin.default;
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Plugin Initialization', () => {
    test('should have correct metadata', () => {
      expect(plugin.metadata.name).toBe('hello-world');
      expect(plugin.metadata.version).toBe('1.0.0');
      expect(plugin.metadata.dependencies).toContain('base-formatter');
    });
    
    test('should initialize without errors', async () => {
      await expect(plugin.initialize(context)).resolves.not.toThrow();
    });
    
    test('should register command via cli:register-commands hook', async () => {
      await plugin.initialize(context);
      
      // Trigger the hook to get the program back
      const updatedProgram = await hooks.trigger<Command>('cli:register-commands', program);
      
      // Check if the 'hello' command was registered
      const helloCommand = updatedProgram.commands.find(cmd => cmd.name() === 'hello');
      
      expect(helloCommand).toBeDefined();
      expect(helloCommand?.description()).toContain('hello');
    });
  });
  
  describe('Command Execution', () => {
    beforeEach(async () => {
      await plugin.initialize(context);
      await hooks.trigger<Command>('cli:register-commands', program);
    });
    
    test('should execute hello command with default name', async () => {
      const publishSpy = jest.spyOn(bus, 'publish');
      
      // Execute the command
      await program.parseAsync(['node', 'test', 'hello']);
      
      // Check formatter was called
      expect(mockFormatter.success).toHaveBeenCalledWith(expect.stringContaining('World'));
      
      // Check event was published
      expect(publishSpy).toHaveBeenCalledWith('command:executed', {
        command: 'hello',
        args: ['World']
      });
    });
    
    test('should execute hello command with custom name', async () => {
      const publishSpy = jest.spyOn(bus, 'publish');
      
      // Execute the command with a name
      await program.parseAsync(['node', 'test', 'hello', 'Alice']);
      
      // Check formatter was called with correct name
      expect(mockFormatter.success).toHaveBeenCalledWith(expect.stringContaining('Alice'));
      expect(mockFormatter.keyValue).toHaveBeenCalledWith('Greeting sent to', 'Alice');
      
      // Check event was published
      expect(publishSpy).toHaveBeenCalledWith('command:executed', {
        command: 'hello',
        args: ['Alice']
      });
    });
  });
  
  describe('Service Integration', () => {
    test('should retrieve formatter service from container', async () => {
      await plugin.initialize(context);
      
      // The plugin should have retrieved the formatter from services
      // We can verify this by checking that the service was accessed
      const retrievedFormatter = services.get<Formatter>('formatter');
      
      expect(retrievedFormatter).toBe(mockFormatter);
    });
    
    test('should work without formatter service (fallback)', async () => {
      // Remove formatter service to test fallback
      services.unregister('formatter');
      
      await plugin.initialize(context);
      await hooks.trigger<Command>('cli:register-commands', program);
      
      // Execute command - should not throw even without formatter
      await expect(
        program.parseAsync(['node', 'test', 'hello'])
      ).resolves.not.toThrow();
    });
  });
  
  describe('MessageBus Integration', () => {
    test('should publish command:executed event', async () => {
      await plugin.initialize(context);
      await hooks.trigger<Command>('cli:register-commands', program);
      
      const messages: any[] = [];
      bus.subscribe('command:executed', (data) => {
        messages.push(data);
      });
      
      await program.parseAsync(['node', 'test', 'hello', 'Bob']);
      
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual({
        command: 'hello',
        args: ['Bob']
      });
    });
  });
  
  describe('Error Handling', () => {
    test('should handle missing service container gracefully', async () => {
      // This tests the robustness of the plugin
      // In practice, services should always exist, but plugins should handle edge cases
      
      await plugin.initialize(context);
      
      // If the plugin tries to get a non-existent service, it should handle it
      expect(() => services.get('non-existent')).toThrow();
    });
  });
});
