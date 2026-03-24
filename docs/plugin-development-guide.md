# Plugin Development Guide

**Version:** 1.0  
**Last Updated:** March 24, 2026

Welcome to the Plugin Development Guide! This document will teach you how to create powerful, extensible plugins for our Node.js plugin architecture framework.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Plugin Anatomy](#plugin-anatomy)
3. [Creating Your First Plugin](#creating-your-first-plugin)
4. [Plugin Context API](#plugin-context-api)
5. [Hook System](#hook-system)
6. [Message Bus](#message-bus)
7. [Service Container](#service-container)
8. [Registering CLI Commands](#registering-cli-commands)
9. [Registering REPL Commands](#registering-repl-commands)
10. [Plugin Dependencies](#plugin-dependencies)
11. [Best Practices](#best-practices)
12. [Testing Your Plugin](#testing-your-plugin)
13. [Complete Examples](#complete-examples)
14. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is a Plugin?

A **plugin** is a self-contained module that extends the functionality of the core application. Plugins can:

- ✅ Register new CLI commands
- ✅ Register new REPL commands
- ✅ Listen to lifecycle events via hooks
- ✅ Communicate with other plugins via message bus
- ✅ Share services with other plugins
- ✅ Depend on other plugins
- ✅ Access configuration and logging

### Why Build a Plugin?

Plugins allow you to:

- **Extend functionality** without modifying core code
- **Maintain separation of concerns** - each plugin does one thing well
- **Share functionality** across projects by packaging plugins
- **Enable/disable features** dynamically  
- **Collaborate** - multiple developers can work on different plugins independently

---

## Plugin Anatomy

Every plugin must implement the `Plugin` interface:

```typescript
import { Plugin, PluginContext, PluginMetadata } from '../src/types/plugin';

class MyPlugin implements Plugin {
  // Required: Metadata describing your plugin
  metadata: PluginMetadata = {
    name: 'my-plugin',           // Unique identifier
    version: '1.0.0',             // Semantic version
    description: 'Does cool stuff', // What it does
    dependencies: []              // Other plugins needed (optional)
  };
  
  // Required: Initialize function called at startup
  async initialize(context: PluginContext): Promise<void> {
    // Your plugin code goes here
  }
  
  // Optional: Cleanup function called at shutdown
  async shutdown(): Promise<void> {
    // Clean up resources if needed
  }
}

// Export as default
export default new MyPlugin();
```

### Directory Structure

Plugins live in the `plugins/` directory with this structure:

```
plugins/
└── my-plugin/
    ├── index.ts          # Main plugin file (required)
    ├── README.md         # Plugin documentation (recommended)
    └── package.json      # Plugin metadata (optional)
```

The framework discovers plugins by scanning `plugins/` directories for `index.ts` or `index.js` files.

---

## Creating Your First Plugin

Let's create a simple "echo" plugin that repeats back what the user types.

### Step 1: Create Plugin Directory

```bash
mkdir -p plugins/echo
cd plugins/echo
```

### Step 2: Create index.ts

```typescript
/**
 * Echo Plugin
 * 
 * A simple plugin that echoes back user input.
 * Demonstrates basic plugin structure and command registration.
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';
import { Command } from 'commander';

class EchoPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'echo',
    version: '1.0.0',
    description: 'Echoes back your input'
  };
  
  async initialize(context: PluginContext): Promise<void> {
    const { logger, hooks } = context;
    
    logger.info('Initializing echo plugin');
    
    // Register CLI command
    hooks.register<Command>('cli:register-commands', (program) => {
      program
        .command('echo <message>')
        .description('Echo a message')
        .action((message: string) => {
          console.log(`Echo: ${message}`);
        });
      
      return program; // Always return program for filter hooks
    });
    
    logger.success('Echo plugin initialized');
  }
}

export default new EchoPlugin();
```

### Step 3: Restart the Application

The plugin manager will automatically discover and load your plugin on next startup:

```bash
npm run build
npm start -- echo "Hello World"
# Output: Echo: Hello World
```

**Congratulations!** 🎉 You've created your first plugin!

---

## Plugin Context API

When `initialize()` is called, your plugin receives a `PluginContext` object with these services:

### 1. Logger

Automatically namespaced with your plugin name:

```typescript
async initialize(context: PluginContext): Promise<void> {
  const { logger } = context;
  
  logger.info('Starting up');        // Info messages
  logger.debug('Debug info');        // Debug (only if debug enabled)
  logger.warn('Warning');            // Warnings
  logger.error('Error', error);      // Errors with stack traces
  logger.success('Done!');           // Success messages (green)
}
```

All log messages are automatically prefixed with `[your-plugin-name]`.

### 2. Config

Access configuration values (namespaced to your plugin):

```typescript
const { config } = context;

// Get config value with default
const timeout = config.get('timeout', 5000);

// Set config value
config.set('lastRun', Date.now());

// Check if config exists
if (config.has('apiKey')) {
  // Use the API key
}
```

### 3. Services (ServiceContainer)

Access shared services from other plugins:

```typescript
const { services } = context;

// Get a service registered by another plugin
try {
  const formatter = services.get<Formatter>('formatter');
  formatter.success('It works!');
} catch (error) {
  // Service not available - handle gracefully
}

// Register your own service for other plugins to use
services.register('myService', myServiceInstance);
```

### 4. Hooks (HookRegistry)

Listen to and modify events:

```typescript
const { hooks } = context;

// Register a hook handler (priority 10 is default)
hooks.register('some-event', (data) => {
  // Do something with data
  return data; // Return modified data (for filter hooks)
}, 10);

// Trigger a hook (for plugin authors creating new hooks)
await hooks.trigger('my-custom-event', { some: 'data' });
```

### 5. Bus (MessageBus)

Publish and subscribe to messages:

```typescript
const { bus } = context;

// Subscribe to messages
const unsubscribe = bus.subscribe('user-login', (data) => {
  console.log(`User logged in: ${data.username}`);
});

// Publish messages
await bus.publish('command-executed', {
  command: 'hello',
  timestamp: Date.now()
});

// Cleanup subscription when done
unsubscribe();
```

### 6. Program (Commander)

Access the root CLI program (for registering commands):

```typescript
const { program } = context;

program
  .command('mycommand')
  .description('My custom command')
  .action(() => {
    console.log('Command executed!');
  });
```

---

## Hook System

Hooks allow plugins to respond to lifecycle events and modify data flowing through the system.

### Hook Types

**Filter Hooks (trigger)**  
Sequential pipeline where each handler can modify data:

```typescript
// Register a filter that modifies data
hooks.register<string>('format-output', (text) => {
  return text.toUpperCase(); // Modify and return
});

// Later, when triggered:
let output = await hooks.trigger('format-output', 'hello');
// output = 'HELLO'
```

**Action Hooks (broadcast)**  
Parallel execution where handlers just observe events:

```typescript
// Register an action that observes but doesn't modify
hooks.register('app-started', (data) => {
  console.log('App started!');
  // Return value is ignored
});

// Later, when triggered:
await hooks.broadcast('app-started', { timestamp: Date.now() });
```

### Built-in Hooks

These hooks are fired by the core at specific points:

| Hook Name | Type | When Fired | Data Passed |
|-----------|------|------------|-------------|
| `cli:startup` | Action | App starts (CLI mode) | `{ config, services }` |
| `cli:register-commands` | Filter | Before parsing CLI args | `program: Command` |
| `cli:shutdown` | Action | App shuts down | `null` |
| `repl:startup` | Action | REPL starts | `{ registry, session }` |
| `repl:register-commands` | Filter | REPL initializing | `registry: REPLCommandRegistry` |
| `repl:command-executed` | Action | After REPL command runs | `{ command, args, result }` |
| `repl:shutdown` | Action | REPL exits | `null` |

### Hook Priority

Lower numbers run first (default is 10):

```typescript
// Run early (before most plugins)
hooks.register('my-hook', handler, 5);

// Run at normal priority
hooks.register('my-hook', handler, 10);

// Run late (after most plugins)
hooks.register('my-hook', handler, 20);
```

### Creating Custom Hooks

You can create your own hooks for other plugins to use:

```typescript
// In your plugin:
async initialize(context: PluginContext): Promise<void> {
  const { hooks } = context;
  
  // Trigger your custom hook
  const result = await hooks.trigger('my-plugin:process-data', {
    input: 'some data'
  });
  
  console.log('Processed result:', result);
}
```

Other plugins can listen:

```typescript
// In another plugin:
hooks.register('my-plugin:process-data', (data) => {
  // Transform the data
  return { ...data, processed: true };
});
```

---

## Message Bus

The message bus provides **publish-subscribe** (pub/sub) messaging for loose coupling between plugins.

### When to Use Hooks vs Message Bus

| Use Hooks When... | Use Message Bus When... |
|-------------------|-------------------------|
| You need to modify data in a pipeline | You're broadcasting events for observation |
| Order of execution matters | Order doesn't matter |
| You need synchronous execution | Async is fine |
| Core lifecycle events | Custom plugin-to-plugin communication |

### Publishing Messages

```typescript
async initialize(context: PluginContext): Promise<void> {
  const { bus } = context;
  
  // Publish a message (async - waits for all subscribers)
  await bus.publish('user-action', {
    action: 'file-saved',
    filename: 'test.txt'
  });
  
  // Publish synchronously (fire-and-forget)
  bus.publishSync('background-task', { task: 'cleanup' });
}
```

### Subscribing to Messages

```typescript
async initialize(context: PluginContext): Promise<void> {
  const { bus } = context;
  
  // Subscribe to a topic
  const unsubscribe = bus.subscribe<MessageData>('user-action', (data) => {
    console.log(`Action: ${data.action}`);
  });
  
  // Store unsubscribe function for later cleanup
  this.unsubscribeCallbacks.push(unsubscribe);
}

async shutdown(): Promise<void> {
  // Clean up subscriptions
  this.unsubscribeCallbacks.forEach(fn => fn());
}
```

### Error Isolation

Errors in one subscriber don't affect others:

```typescript
bus.subscribe('some-topic', (data) => {
  throw new Error('Oops!'); // This won't crash other subscribers
});

bus.subscribe('some-topic', (data) => {
  console.log('I still run even if the above crashes!');
});
```

---

## Service Container

The service container allows plugins to share functionality with each other.

### Registering a Service

```typescript
class MyFormatterPlugin implements Plugin {
  async initialize(context: PluginContext): Promise<void> {
    const { services, logger } = context;
    
    // Create your service
    const formatter = {
      success: (msg: string) => console.log(`✓ ${msg}`),
      error: (msg: string) => console.error(`✗ ${msg}`),
    };
    
    // Register it for other plugins to use
    services.register('formatter', formatter);
    
    logger.info('Formatter service registered');
  }
}
```

### Consuming a Service

```typescript
class MyConsumerPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'consumer',
    version: '1.0.0',
    description: 'Uses formatter service',
    // Declare the dependency so we load after formatter
    dependencies: ['my-formatter']
  };
  
  async initialize(context: PluginContext): Promise<void> {
    const { services } = context;
    
    try {
      // Get the service
      const formatter = services.get<Formatter>('formatter');
      formatter.success('Got the formatter!');
    } catch (error) {
      // Service not available - fallback gracefully
      console.log('Formatter not available');
    }
  }
}
```

### Best Practices for Services

1. **Export TypeScript interfaces** so consumers know the API
2. **Handle missing services gracefully** - not all plugins may be loaded
3. **Document your service** in your plugin's README
4. **Use dependency declarations** to ensure load order

---

## Registering CLI Commands

Plugins register CLI commands via the `cli:register-commands` hook.

### Basic Command

```typescript
hooks.register<Command>('cli:register-commands', (program) => {
  program
    .command('greet <name>')
    .description('Greet someone by name')
    .action((name: string) => {
      console.log(`Hello, ${name}!`);
    });
  
  return program; // Always return program
});
```

### Command with Options

```typescript
hooks.register<Command>('cli:register-commands', (program) => {
  program
    .command('deploy')
    .description('Deploy the application')
    .option('-e, --environment <env>', 'Target environment', 'production')
    .option('-f, --force', 'Force deployment')
    .action((options) => {
      console.log(`Deploying to ${options.environment}`);
      if (options.force) {
        console.log('Force mode enabled');
      }
    });
  
  return program;
});
```

### Async Actions

```typescript
hooks.register<Command>('cli:register-commands', (program) => {
  program
    .command('fetch')
    .description('Fetch data from API')
    .action(async () => {
      console.log('Fetching...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Done!');
    });
  
  return program;
});
```

---

## Registering REPL Commands

REPL commands provide an interactive shell experience. They're registered via the `repl:register-commands` hook.

### Basic REPL Command

```typescript
import { REPLCommandRegistry } from '../../src/cli/repl/REPLCommandRegistry';

hooks.register<REPLCommandRegistry>('repl:register-commands', (registry) => {
  registry.register({
    name: 'greet',
    aliases: ['hello', 'hi'],
    description: 'Greet someone',
    usage: 'greet [name]',
    plugin: this.metadata.name,
    handler: async (args, context) => {
      const name = args[0] || 'World';
      context.print(`Hello, ${name}!`);
    },
  });
  
  return registry; // Always return registry
});
```

### REPL Context API

The REPL handler receives a context object:

```typescript
handler: async (args, context) => {
  // Print normal output
  context.print('Normal message');
  
  // Print success (green)
  context.printSuccess('Success!');
  
  // Print error (red)
  context.printError('Error occurred');
  
  // Print info (blue)
  context.printInfo('Info message');
  
  // Access logger
  context.logger.debug('Debug info');
  
  // Access services
  const service = context.services.get('myService');
  
  // Access plugin manager
  const plugins = await context.pluginManager.getAllPlugins();
}
```

### Argument Types for Auto-completion

Enable smart auto-completion by specifying argument types:

```typescript
registry.register({
  name: 'edit',
  description: 'Edit a file',
  usage: 'edit <file>',
  plugin: this.metadata.name,
  argumentTypes: ['path'], // Enable file path completion
  handler: async (args, context) => {
    // args[0] will be a file path
  },
});
```

Available argument types:
- `'path'` - File/directory paths
- `'plugin'` - Plugin names
- `'command'` - Command names

---

## Plugin Dependencies

If your plugin relies on another plugin, declare it in dependencies:

```typescript
metadata: PluginMetadata = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'Depends on formatter',
  // This plugin needs base-formatter to be loaded first
  dependencies: ['base-formatter']
};
```

### How Dependencies Work

1. The plugin manager performs **topological sorting**
2. Dependencies are loaded **before** dependents
3. Circular dependencies are **detected and rejected**
4. Missing dependencies cause an **error at startup**

### Example: Using a Dependency

```typescript
// base-formatter plugin registers a service
class BaseFormatterPlugin implements Plugin {
  async initialize(context: PluginContext): Promise<void> {
    const formatter = {
      success: (msg: string) => console.log(`✓ ${msg}`),
      error: (msg: string) => console.error(`✗ ${msg}`),
    };
    
    context.services.register('formatter', formatter);
  }
}

// your-plugin uses the formatter (declares dependency)
class YourPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'your-plugin',
    version: '1.0.0',
    description: 'Uses formatter',
    dependencies: ['base-formatter'] // Load after base-formatter
  };
  
  async initialize(context: PluginContext): Promise<void> {
    // Safe to use - base-formatter loaded first
    const formatter = context.services.get('formatter');
    formatter.success('Plugin initialized!');
  }
}
```

---

## Best Practices

### 1. Handle Errors Gracefully

```typescript
async initialize(context: PluginContext): Promise<void> {
  try {
    // Risky operation
    await this.loadExternalResource();
  } catch (error) {
    context.logger.error('Failed to load resource', error);
    // Don't throw - allow other plugins to continue
  }
}
```

### 2. Clean Up on Shutdown

```typescript
private connections: Connection[] = [];

async initialize(context: PluginContext): Promise<void> {
  const conn = await createConnection();
  this.connections.push(conn);
}

async shutdown(): Promise<void> {
  // Close all connections
  await Promise.all(
    this.connections.map(conn => conn.close())
  );
}
```

### 3. Use TypeScript Interfaces

```typescript
// Export interface for service consumers
export interface MyService {
  doSomething(input: string): Promise<string>;
}

// Register with type
context.services.register<MyService>('myService', myServiceImpl);
```

### 4. Namespace Your Hooks

```typescript
// Good: namespaced hook names
await hooks.trigger('myplugin:data-processed', data);

// Bad: generic hook name (might conflict)
await hooks.trigger('processed', data);
```

### 5. Document Your Plugin

Create a README.md in your plugin directory:

```markdown
# My Plugin

## Description
What this plugin does.

## Commands
- `myplugin command` - Description

## Configuration
- `myplugin.option` - Description (default: value)

## Services Provided
- `myService` - Description

## Dependencies
- Requires: `other-plugin`

## Example
...
```

### 6. Check Service Availability

```typescript
// Good: handle missing service
try {
  const formatter = services.get<Formatter>('formatter');
  formatter.success(message);
} catch {
  console.log(message); // Fallback
}

// Bad: assume service exists
const formatter = services.get<Formatter>('formatter');
formatter.success(message); // Crashes if not available
```

---

## Testing Your Plugin

### Manual Testing

```bash
# Build the project
npm run build

# Test CLI command
npm start -- yourcommand arg1 arg2

# Test REPL command
npm run repl
# Then type: yourcommand arg1 arg2
```

### Unit Testing (Jest)

Create `plugins/your-plugin/your-plugin.test.ts`:

```typescript
import { Plugin, PluginContext } from '../../src/types/plugin';
import YourPlugin from './index';

describe('YourPlugin', () => {
  let mockContext: PluginContext;
  
  beforeEach(() => {
    // Create mock context
    mockContext = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        success: jest.fn(),
      },
      config: {
        get: jest.fn(),
        set: jest.fn(),
        has: jest.fn(),
      },
      services: {
        get: jest.fn(),
        register: jest.fn(),
        has: jest.fn(),
      },
      hooks: {
        register: jest.fn(),
        trigger: jest.fn(),
      },
      bus: {
        subscribe: jest.fn(),
        publish: jest.fn(),
      },
      program: {} as any,
    };
  });
  
  it('should initialize without errors', async () => {
    await expect(YourPlugin.initialize(mockContext)).resolves.not.toThrow();
  });
  
  it('should register a command', async () => {
    await YourPlugin.initialize(mockContext);
    expect(mockContext.hooks.register).toHaveBeenCalledWith(
      'cli:register-commands',
      expect.any(Function)
    );
  });
});
```

Run tests:

```bash
npm test
```

---

## Complete Examples

### Example 1: Simple Timer Plugin

```typescript
/**
 * Timer Plugin
 * 
 * Tracks how long commands take to execute.
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';

class TimerPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'timer',
    version: '1.0.0',
    description: 'Tracks command execution time'
  };
  
  async initialize(context: PluginContext): Promise<void> {
    const { bus, logger } = context;
    
    const timers = new Map<string, number>();
    
    // Listen for command start
    bus.subscribe('command:start', (data: any) => {
      timers.set(data.command, Date.now());
    });
    
    // Listen for command end
    bus.subscribe('command:end', (data: any) => {
      const startTime = timers.get(data.command);
      if (startTime) {
        const duration = Date.now() - startTime;
        logger.info(`Command "${data.command}" took ${duration}ms`);
        timers.delete(data.command);
      }
    });
    
    logger.success('Timer plugin initialized');
  }
}

export default new TimerPlugin();
```

### Example 2: Database Service Plugin

```typescript
/**
 * Database Plugin
 * 
 * Provides a database connection service for other plugins.
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';

// Define the service interface
export interface Database {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
}

class DatabasePlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'database',
    version: '1.0.0',
    description: 'Provides database connection service'
  };
  
  private db?: Database;
  
  async initialize(context: PluginContext): Promise<void> {
    const { services, logger, config } = context;
    
    // Get connection string from config
    const connectionString = config.get('db.connectionString', 'sqlite::memory:');
    
    // Create database connection (mock example)
    this.db = {
      query: async (sql: string) => {
        logger.debug(`Executing: ${sql}`);
        return []; // Mock result
      },
      close: async () => {
        logger.info('Database connection closed');
      }
    };
    
    // Register service for other plugins
    services.register<Database>('database', this.db);
    
    logger.success('Database plugin initialized');
  }
  
  async shutdown(): Promise<void> {
    // Close database connection
    await this.db?.close();
  }
}

export default new DatabasePlugin();
```

### Example 3: Weather Plugin (External API)

```typescript
/**
 * Weather Plugin
 * 
 * Fetches weather data from an external API.
 */

import { Plugin, PluginContext, PluginMetadata } from '../../src/types/plugin';
import { Command } from 'commander';

class WeatherPlugin implements Plugin {
  metadata: PluginMetadata = {
    name: 'weather',
    version: '1.0.0',
    description: 'Fetches weather information',
    dependencies: ['base-formatter'] // Use formatter for output
  };
  
  async initialize(context: PluginContext): Promise<void> {
    const { hooks, services, logger } = context;
    
    logger.info('Initializing weather plugin');
    
    const formatter = services.get<any>('formatter');
    
    // Register CLI command
    hooks.register<Command>('cli:register-commands', (program) => {
      program
        .command('weather <city>')
        .description('Get weather for a city')
        .action(async (city: string) => {
          try {
            formatter.info(`Fetching weather for ${city}...`);
            
            // Mock API call (replace with real API)
            const weather = await this.fetchWeather(city);
            
            formatter.keyValue('City', weather.city);
            formatter.keyValue('Temperature', `${weather.temp}°C`);
            formatter.keyValue('Condition', weather.condition);
          } catch (error) {
            formatter.error(`Failed to fetch weather: ${error.message}`);
          }
        });
      
      return program;
    });
    
    logger.success('Weather plugin initialized');
  }
  
  private async fetchWeather(city: string): Promise<any> {
    // Mock implementation - replace with real API call
    return {
      city,
      temp: 22,
      condition: 'Sunny'
    };
  }
}

export default new WeatherPlugin();
```

---

## Troubleshooting

### Plugin Not Loading

**Problem:** Plugin doesn't appear in the plugin list.

**Solutions:**
1. Ensure `index.ts` or `index.js` exists in plugin directory
2. Check that plugin exports `default` correctly
3. Run `npm run build` to compile TypeScript
4. Check logs for loading errors: `npm start -- --verbose`

### Dependency Errors

**Problem:** "Plugin dependency 'foo' not found"

**Solutions:**
1. Ensure the dependency plugin exists in `plugins/` directory
2. Check spelling of dependency name in `metadata.dependencies`
3. Ensure the dependency plugin exports valid metadata

### Service Not Found

**Problem:** `services.get('myService')` throws an error

**Solutions:**
1. Add the service-providing plugin to your `dependencies` array
2. Check that the service name matches exactly (case-sensitive)
3. Verify the service is actually registered by the other plugin

### Hook Not Firing

**Problem:** Your hook handler never gets called

**Solutions:**
1. Check hook name spelling (must match exactly)
2. Ensure you're registering during `initialize()`, not after
3. Verify the hook is actually being triggered by the core

---

## Next Steps

- **Browse example plugins** in `plugins/` directory
- **Read the source code** of `base-formatter` and `hello-world` plugins
- **Join the community** (if applicable) to share your plugins
- **Contribute back** by submitting useful plugins to the repository

---

## API Reference

For detailed API documentation, see:
- [Plugin Type Definitions](../src/types/plugin.ts)
- [Hook Registry API](../src/hooks/HookRegistry.ts)
- [Message Bus API](../src/bus/MessageBus.ts)
- [Service Container API](../src/core/ServiceContainer.ts)

---

**Happy Plugin Development!** 🚀

If you have questions or find issues, please open an issue on our repository.
