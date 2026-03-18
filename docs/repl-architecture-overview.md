# Custom CLI REPL Architecture Overview

**Version:** 1.0  
**Date:** March 18, 2026  
**Status:** Design Phase

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Context](#system-context)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Responsibilities](#component-responsibilities)
5. [Interaction Flows](#interaction-flows)
6. [Design Principles](#design-principles)

---

## Executive Summary

This document describes the architecture for a custom interactive REPL (Read-Eval-Print Loop) environment for the plugin-based Node.js CLI application. The REPL provides an interactive shell where users can manage plugins, execute custom commands, and interact with the plugin ecosystem in real-time.

### Key Features

- **Interactive Shell**: Built using Node.js native `readline` module (no external dependencies)
- **Plugin Integration**: Seamless integration with existing PluginManager, HookRegistry, MessageBus, and ServiceContainer
- **Dynamic Command Registration**: Plugins can register custom commands at runtime
- **Session Management**: Independent session state with history persistence
- **Rich UX**: Auto-completion, command history, multi-line editing, and contextual help

### Core Benefits

1. **Zero External Dependencies**: Uses only Node.js built-in `readline` module
2. **Plugin-First Design**: Every command comes from plugins (extensible architecture)
3. **Backward Compatible**: Existing Commander.js CLI remains functional alongside REPL mode
4. **Developer-Friendly**: Clean API for plugin authors to add interactive commands

---

## System Context

### Current Architecture

The application currently uses:
- **Commander.js** for traditional CLI commands (`plugin-cli <command>`)
- **PluginManager** for plugin lifecycle management
- **HookRegistry** for event-driven communication between plugins
- **MessageBus** for pub/sub messaging
- **ServiceContainer** for dependency injection
- **Entry point** (`src/index.ts`) that bootstraps all core services

### REPL Integration Point

The REPL mode will coexist with the existing Commander.js mode:

```
$ plugin-cli            # Shows help (current behavior)
$ plugin-cli repl       # Enters interactive REPL mode (new)
$ plugin-cli <command>  # Executes one-off command (current behavior)
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Terminal (TTY)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ (stdin/stdout)
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   REPL Entry Point                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  REPLController                                          │  │
│  │  - Bootstrap core services                               │  │
│  │  - Initialize PluginManager                              │  │
│  │  - Create ReadlineInterface                              │  │
│  │  - Start command loop                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────────┐       ┌────────▼───────────┐
│  CommandRegistry │       │  SessionManager    │
│  - Store commands│       │  - Session state   │
│  - Route input   │       │  - History         │
│  - Handle args   │       │  - Context vars    │
└───────┬──────────┘       └────────┬───────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │    Core Services          │
        │  ┌────────────────────┐   │
        │  │ PluginManager      │   │
        │  ├────────────────────┤   │
        │  │ HookRegistry       │   │
        │  ├────────────────────┤   │
        │  │ MessageBus         │   │
        │  ├────────────────────┤   │
        │  │ ServiceContainer   │   │
        │  ├────────────────────┤   │
        │  │ Config             │   │
        │  ├────────────────────┤   │
        │  │ Logger             │   │
        │  └────────────────────┘   │
        └───────────┬───────────────┘
                    │
        ┌───────────▼───────────┐
        │   Plugin Ecosystem    │
        │  ┌─────────────────┐  │
        │  │ Plugin A        │  │
        │  │ - Commands      │  │
        │  │ - Hooks         │  │
        │  └─────────────────┘  │
        │  ┌─────────────────┐  │
        │  │ Plugin B        │  │
        │  │ - Commands      │  │
        │  │ - Hooks         │  │
        │  └─────────────────┘  │
        └───────────────────────┘
```

---

## Component Responsibilities

### 1. **REPLController** (New Component)

**Location**: `src/cli/REPLController.ts`

**Responsibilities**:
- Bootstrap all core services (Logger, Config, ServiceContainer, HookRegistry, MessageBus)
- Initialize PluginManager and load all plugins
- Create and configure `readline.Interface`
- Manage REPL lifecycle (startup, shutdown, signal handling)
- Display welcome banner and prompt
- Coordinate between CommandRegistry and SessionManager

**Key Methods**:
```typescript
class REPLController {
  async start(): Promise<void>
  async shutdown(): Promise<void>
  private handleLine(input: string): Promise<void>
  private setupSignalHandlers(): void
  private displayWelcome(): void
}
```

---

### 2. **CommandRegistry** (New Component)

**Location**: `src/cli/repl/CommandRegistry.ts`

**Responsibilities**:
- Store all registered REPL commands (from plugins)
- Parse user input into command + arguments
- Route commands to appropriate handlers
- Provide command metadata (help, aliases, usage)
- Support command namespacing (e.g., `plugin:list`)

**Key Methods**:
```typescript
class CommandRegistry {
  register(command: REPLCommand): void
  unregister(name: string): void
  execute(input: string, context: REPLContext): Promise<void>
  getCommand(name: string): REPLCommand | undefined
  getAllCommands(): REPLCommand[]
  getCompletions(partial: string): string[]
}
```

---

### 3. **SessionManager** (New Component)

**Location**: `src/cli/repl/SessionManager.ts`

**Responsibilities**:
- Maintain session-specific state (variables, context)
- Persist command history to disk
- Provide history navigation
- Store session metadata (start time, command count)
- Support session save/load for advanced use cases

**Key Methods**:
```typescript
class SessionManager {
  getVariable(name: string): unknown
  setVariable(name: string, value: unknown): void
  getHistory(): string[]
  addHistory(command: string): void
  saveHistory(): Promise<void>
  loadHistory(): Promise<void>
  getSessionInfo(): SessionInfo
}
```

---

### 4. **AutoCompleter** (New Component)

**Location**: `src/cli/repl/AutoCompleter.ts`

**Responsibilities**:
- Implement Tab auto-completion for commands
- Provide context-aware completion (command names, arguments, file paths)
- Integrate with CommandRegistry for command suggestions
- Support plugin-specific completion handlers

**Key Methods**:
```typescript
class AutoCompleter {
  complete(line: string): [string[], string]
  registerCompletionProvider(pattern: string, provider: CompletionProvider): void
}
```

---

### 5. **REPLContext** (New Type)

**Location**: `src/cli/repl/types.ts`

Injected into every command handler, provides access to:
- Core services (Logger, Config, PluginManager, etc.)
- Session data (variables, history)
- REPL utilities (prompt, clear screen, etc.)

```typescript
interface REPLContext {
  logger: Logger;
  config: Config;
  services: ServiceContainer;
  hooks: HookRegistry;
  bus: MessageBus;
  pluginManager: PluginManager;
  session: SessionManager;
  output: (message: string) => void;
  error: (message: string) => void;
  prompt: () => void;
}
```

---

## Interaction Flows

### Flow 1: REPL Startup

```
User runs: plugin-cli repl
    │
    ├─> REPLController.start()
    │
    ├─> Bootstrap core services
    │   ├─> Create Logger, Config, ServiceContainer
    │   ├─> Create HookRegistry, MessageBus
    │   └─> Initialize PluginManager
    │
    ├─> Load all plugins
    │   ├─> PluginManager.discoverPlugins()
    │   ├─> PluginManager.loadPlugin() for each
    │   └─> PluginManager.initializeAll()
    │
    ├─> Trigger 'repl:startup' hook (broadcast)
    │   └─> Plugins register REPL commands
    │
    ├─> Create SessionManager
    │   └─> Load command history from disk
    │
    ├─> Create readline.Interface with:
    │   ├─> input: process.stdin
    │   ├─> output: process.stdout
    │   ├─> completer: AutoCompleter.complete
    │   └─> prompt: 'plugin> '
    │
    ├─> Setup signal handlers (SIGINT, SIGTERM)
    │
    ├─> Display welcome banner
    │
    └─> Enter event loop (listen for 'line' events)
```

---

### Flow 2: Command Execution

```
User types: list plugins
    │
    ├─> readline fires 'line' event
    │
    ├─> REPLController.handleLine("list plugins")
    │
    ├─> SessionManager.addHistory("list plugins")
    │
    ├─> CommandRegistry.execute("list plugins", context)
    │   │
    │   ├─> Parse input: { command: "list", args: ["plugins"] }
    │   │
    │   ├─> CommandRegistry.getCommand("list")
    │   │   └─> Returns: REPLCommand instance
    │   │
    │   ├─> Validate arguments
    │   │   └─> Match against command schema
    │   │
    │   └─> Execute command handler
    │       └─> handler({ args: ["plugins"], ...context })
    │           │
    │           ├─> Handler logic (e.g., query PluginManager)
    │           │
    │           └─> Output results to stdout
    │
    ├─> Trigger 'repl:command-executed' hook
    │   └─> Pass { command: "list", args: [...] }
    │
    └─> Display prompt again
```

---

### Flow 3: Plugin Registering a Command

```
Plugin initialize() method called
    │
    ├─> context.hooks.register('repl:startup', async (replContext) => {
    │       │
    │       ├─> replContext.commands.register({
    │       │       name: 'myplugin:dosomething',
    │       │       description: 'Does something cool',
    │       │       usage: 'myplugin:dosomething [options]',
    │       │       handler: async (ctx) => {
    │       │           ctx.output('Doing something cool!');
    │       │       }
    │       │   });
    │       │
    │       └─> context.logger.info('Registered myplugin:dosomething command');
    │   });
    │
    └─> Command now available in REPL
```

---

### Flow 4: Auto-Completion

```
User types: list pl<Tab>
    │
    ├─> readline triggers completer function
    │
    ├─> AutoCompleter.complete("list pl")
    │   │
    │   ├─> Determine context: "list " already typed, completing argument
    │   │
    │   ├─> Get command: CommandRegistry.getCommand("list")
    │   │   └─> Check if command has custom completion handler
    │   │
    │   ├─> Call command.completer("pl")
    │   │   └─> Returns: ["plugins", "platform"]
    │   │
    │   └─> Return: [["plugins", "platform"], "pl"]
    │
    └─> readline displays: "plugins  platform"
```

---

## Design Principles

### 1. **Plugin-First Architecture**

The REPL core provides NO built-in commands (except `.help`, `.exit`, `.clear` which are standard REPL conventions). All functionality comes from plugins.

**Rationale**: Maintains extensibility and avoids coupling REPL logic to specific features.

---

### 2. **Separation of Concerns**

- **REPLController**: Orchestration and lifecycle
- **CommandRegistry**: Command storage and routing
- **SessionManager**: State and history
- **AutoCompleter**: Completion logic

Each component has a single, well-defined responsibility.

---

### 3. **Backward Compatibility**

The existing Commander.js CLI continues to work exactly as before. The REPL is an additive feature, not a replacement.

---

### 4. **Zero External Dependencies for REPL Core**

Uses only Node.js built-in `readline` module. This keeps the dependency footprint minimal and reduces security/maintenance burden.

---

### 5. **Event-Driven Integration**

Uses existing HookRegistry to notify plugins of REPL lifecycle events:
- `repl:startup` - REPL is starting, register commands
- `repl:shutdown` - REPL is shutting down, cleanup
- `repl:command-executed` - A command was executed
- `repl:command-failed` - A command failed

---

### 6. **Testability**

All components are designed with dependency injection to enable unit testing:
- Mock readline.Interface for REPLController tests
- Mock CommandRegistry for command routing tests
- Mock SessionManager for state tests

---

## Next Steps

1. Review and approve this architecture overview
2. Proceed to **Technical Specification** for detailed implementation details
3. Develop **Integration Points** document for hook and service interactions
4. Define **Plugin API** for command registration patterns
5. Design **User Experience Flow** with example sessions
6. Create **Implementation Roadmap** with milestones
7. Document **Trade-offs Analysis** for design decisions

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-18 | Hayman | Initial architecture design |
