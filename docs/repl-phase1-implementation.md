# REPL Phase 1 Implementation Plan: Minimal Viable REPL

**Version:** 1.0  
**Date:** March 18, 2026  
**Status:** Implementation Ready  
**Related:** [repl-architecture-overview.md](repl-architecture-overview.md)

---

## Table of Contents

1. [Phase 1 Scope](#phase-1-scope)
2. [Component Design](#component-design)
3. [File Structure](#file-structure)
4. [Implementation Steps](#implementation-steps)
5. [Code Skeletons](#code-skeletons)
6. [Testing Strategy](#testing-strategy)
7. [Success Criteria](#success-criteria)
8. [Bridge to Phase 2](#bridge-to-phase-2)

---

## Phase 1 Scope

### What WILL Be Implemented

✅ **Minimal REPL Shell**
- Display a simple prompt: `plugin> `
- Accept user input from stdin
- Echo commands back (for validation during development)
- Exit on `exit` command or `Ctrl+C`

✅ **Basic Command Handling**
- Parse input into command + arguments
- Hardcoded "exit" and "help" commands
- "Command not found" error for unknown commands
- Output to stdout/stderr appropriately

✅ **Lifecycle Management**
- Start REPL loop
- Handle graceful shutdown (cleanup on exit)
- Signal handling (SIGINT for Ctrl+C)

✅ **Simple Error Handling**
- Catch and display errors without crashing
- User-friendly error messages

### What Will NOT Be Implemented

❌ **Plugin Integration** - No PluginManager, no plugin loading, no dynamic commands  
❌ **Core Services** - No Logger, Config, ServiceContainer, HookRegistry, MessageBus  
❌ **Auto-completion** - No Tab completion (Phase 2)  
❌ **Command History** - No up/down arrow history, no persistence (Phase 2)  
❌ **Multi-line Input** - Single-line only (Phase 2)  
❌ **Command Registry** - No dynamic registration, commands are hardcoded  
❌ **Session Management** - No session variables, no state persistence  
❌ **Welcome Banner** - Keep it minimal (just start the prompt)  
❌ **Color/Formatting** - No chalk, no ANSI colors (optional in Phase 2)

### Why This Scope?

This is a **proof-of-concept** that demonstrates:
1. The basic readline event loop works correctly
2. Input parsing and routing logic is sound
3. Exit handling works cleanly
4. Foundation is in place for adding features incrementally

**Time Estimate:** 2-4 hours for a developer familiar with Node.js/TypeScript

---

## Component Design

### Architecture Overview (Phase 1)

```
┌─────────────────────────────────────────┐
│         User Terminal (stdin/stdout)    │
└─────────────────┬───────────────────────┘
                  │
                  │ (readline)
                  │
┌─────────────────▼───────────────────────┐
│         MinimalREPL                     │
│  ┌───────────────────────────────────┐  │
│  │ - Create readline.Interface       │  │
│  │ - Set prompt: "plugin> "          │  │
│  │ - Listen for 'line' events        │  │
│  │ - Handle 'close' event            │  │
│  │ - Signal handlers (SIGINT)        │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  │
┌─────────────────▼───────────────────────┐
│       handleCommand(input: string)      │
│  ┌───────────────────────────────────┐  │
│  │ - Split input into parts          │  │
│  │ - Match command name              │  │
│  │ - Execute handler or show error   │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼─────┐      ┌──────▼──────┐
   │ exit     │      │ help        │
   │ handler  │      │ handler     │
   └──────────┘      └─────────────┘
```

### Components

**1. MinimalREPL Class** (`src/cli/MinimalREPL.ts`)

Single-responsibility: Manage the REPL lifecycle and coordinate input/output.

**Key Responsibilities:**
- Create and configure `readline.Interface`
- Display prompt
- Parse and route commands
- Handle exit/shutdown
- Error handling

**No External Dependencies:** Only uses Node.js built-in modules (`readline`, `process`)

---

## File Structure

```
src/
├── index.ts                    # (no changes - existing entry point)
└── cli/
    ├── MinimalREPL.ts          # ← NEW: Main REPL controller
    └── repl-entry.ts           # ← NEW: Standalone entry point for REPL
```

### File Responsibilities

#### `src/cli/MinimalREPL.ts`
- **Purpose:** Core REPL implementation (class)
- **Exports:** `MinimalREPL` class
- **Dependencies:** `readline`, `process`
- **Lines of Code:** ~150 LOC (with comments)

#### `src/cli/repl-entry.ts`
- **Purpose:** Standalone executable entry point for REPL mode
- **Exports:** None (executes immediately)
- **Dependencies:** `MinimalREPL`
- **Lines of Code:** ~20 LOC
- **Usage:** `ts-node src/cli/repl-entry.ts` or `node dist/cli/repl-entry.js`

---

## Implementation Steps

### Step 1: Create MinimalREPL.ts Skeleton

**Action:** Create `src/cli/MinimalREPL.ts` with class structure and imports

**Checklist:**
- [ ] Import `readline` and `process`
- [ ] Define `MinimalREPL` class
- [ ] Add constructor (initialize properties)
- [ ] Add method stubs: `start()`, `shutdown()`, `handleCommand()`, `showHelp()`

**Time:** 10 minutes

---

### Step 2: Implement start() Method

**Action:** Set up readline interface and prompt

**Checklist:**
- [ ] Create `readline.createInterface()` with stdin/stdout
- [ ] Set prompt to `"plugin> "`
- [ ] Register 'line' event listener
- [ ] Register 'close' event listener
- [ ] Register SIGINT handler
- [ ] Call `rl.prompt()` to show first prompt

**Time:** 20 minutes

---

### Step 3: Implement handleCommand() Method

**Action:** Parse input and route to handlers

**Checklist:**
- [ ] Trim input
- [ ] Skip empty lines
- [ ] Split input by whitespace: `[command, ...args]`
- [ ] Match command name against hardcoded commands
- [ ] Call appropriate handler
- [ ] Print "Command not found" for unknown commands
- [ ] Wrap in try-catch for error handling

**Time:** 20 minutes

---

### Step 4: Implement Built-in Commands

**Action:** Create handlers for `exit` and `help`

**Checklist:**
- [ ] `exit` command: Call `shutdown()` and close readline
- [ ] `help` command: Call `showHelp()` to print available commands
- [ ] `showHelp()`: Print list of commands with brief descriptions

**Time:** 15 minutes

---

### Step 5: Implement shutdown() Method

**Action:** Clean up resources and exit gracefully

**Checklist:**
- [ ] Close readline interface
- [ ] Print goodbye message
- [ ] Call `process.exit(0)`
- [ ] Handle case where already closed

**Time:** 10 minutes

---

### Step 6: Create repl-entry.ts

**Action:** Create standalone entry point

**Checklist:**
- [ ] Import `MinimalREPL`
- [ ] Instantiate `MinimalREPL`
- [ ] Call `start()`
- [ ] Add shebang: `#!/usr/bin/env node`
- [ ] Wrap in async IIFE if needed

**Time:** 10 minutes

---

### Step 7: Manual Testing

**Action:** Run the REPL and test all scenarios

**Checklist:**
- [ ] Run: `npx ts-node src/cli/repl-entry.ts`
- [ ] Type `help` - should show command list
- [ ] Type `exit` - should exit cleanly
- [ ] Press Ctrl+C - should exit cleanly
- [ ] Type invalid command - should show error
- [ ] Type empty line - should show prompt again

**Time:** 15 minutes

---

### Step 8: Update package.json

**Action:** Add REPL script for convenience

**Checklist:**
- [ ] Add to `"scripts"`: `"repl": "ts-node src/cli/repl-entry.ts"`
- [ ] Test: `npm run repl`

**Time:** 5 minutes

---

### Step 9: Add Comments

**Action:** Document the code thoroughly

**Checklist:**
- [ ] Add JSDoc comments to class and methods
- [ ] Add inline comments explaining key logic
- [ ] Add usage examples in file header

**Time:** 20 minutes

---

**Total Time Estimate:** ~2-3 hours

---

## Code Skeletons

### src/cli/MinimalREPL.ts

```typescript
#!/usr/bin/env node

/**
 * Minimal REPL (Phase 1)
 * 
 * A bare-bones interactive REPL shell that:
 * - Displays a prompt: "plugin> "
 * - Accepts user input
 * - Handles built-in commands: exit, help
 * - Shows "Command not found" for unknown commands
 * - Exits gracefully on Ctrl+C or "exit"
 * 
 * NO plugin integration, NO external libraries.
 * Uses only Node.js built-in 'readline' module.
 * 
 * Usage:
 *   const repl = new MinimalREPL();
 *   repl.start();
 */

import * as readline from 'readline';

/**
 * MinimalREPL - Phase 1 implementation
 * 
 * A simple REPL shell without plugin integration.
 * Foundation for Phase 2 enhancements.
 */
export class MinimalREPL {
  private rl: readline.Interface | null = null;
  private isRunning: boolean = false;

  /**
   * Start the REPL loop
   * 
   * Creates readline interface, sets up event handlers,
   * and begins accepting user input.
   */
  public start(): void {
    // Create readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'plugin> ',
    });

    this.isRunning = true;

    // Handle user input (line by line)
    this.rl.on('line', (input: string) => {
      this.handleCommand(input);
      
      // Show prompt again after command completes
      if (this.isRunning && this.rl) {
        this.rl.prompt();
      }
    });

    // Handle REPL close (Ctrl+D or programmatic close)
    this.rl.on('close', () => {
      if (this.isRunning) {
        this.shutdown();
      }
    });

    // Handle Ctrl+C (SIGINT)
    process.on('SIGINT', () => {
      console.log('\n'); // Newline after ^C
      this.shutdown();
    });

    // Show first prompt
    this.rl.prompt();
  }

  /**
   * Handle a single command input
   * 
   * Parses the input, routes to appropriate handler,
   * or shows "command not found" error.
   * 
   * @param input - Raw user input string
   */
  private handleCommand(input: string): void {
    try {
      // Trim whitespace
      const trimmed = input.trim();

      // Skip empty lines
      if (!trimmed) {
        return;
      }

      // Split into command and arguments
      const parts = trimmed.split(/\s+/);
      const command = parts[0]?.toLowerCase();
      const args = parts.slice(1);

      // Route to handlers
      switch (command) {
        case 'exit':
        case 'quit':
          this.commandExit();
          break;

        case 'help':
          this.commandHelp();
          break;

        default:
          console.error(`Error: Unknown command '${command}'`);
          console.error(`Type 'help' for available commands.`);
      }
    } catch (error) {
      // Catch any unexpected errors
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
    }
  }

  /**
   * Command: exit
   * 
   * Exits the REPL gracefully
   */
  private commandExit(): void {
    console.log('Exiting REPL...');
    this.shutdown();
  }

  /**
   * Command: help
   * 
   * Shows list of available commands
   */
  private commandHelp(): void {
    console.log('Available commands:');
    console.log('  help         Show this help message');
    console.log('  exit, quit   Exit the REPL');
  }

  /**
   * Shutdown the REPL
   * 
   * Cleans up resources and exits the process
   */
  private shutdown(): void {
    if (!this.isRunning) {
      return; // Already shut down
    }

    this.isRunning = false;

    // Close readline interface
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }

    console.log('Goodbye!');
    process.exit(0);
  }
}
```

---

### src/cli/repl-entry.ts

```typescript
#!/usr/bin/env node

/**
 * REPL Entry Point
 * 
 * Standalone executable for launching the minimal REPL.
 * 
 * Usage:
 *   ts-node src/cli/repl-entry.ts
 *   node dist/cli/repl-entry.js
 *   npm run repl
 */

import { MinimalREPL } from './MinimalREPL';

// Create and start REPL
const repl = new MinimalREPL();
repl.start();
```

---

## Testing Strategy

### Manual Testing Checklist

Since this is Phase 1 (minimal scope), manual testing is sufficient. Automated tests will be added in Phase 2.

#### Test Case 1: Normal Startup
- [ ] **Action:** Run `npm run repl`
- [ ] **Expected:** Prompt displays: `plugin> `
- [ ] **Pass/Fail:** ______

#### Test Case 2: Help Command
- [ ] **Action:** Type `help` and press Enter
- [ ] **Expected:** Shows list of commands (help, exit)
- [ ] **Pass/Fail:** ______

#### Test Case 3: Exit Command
- [ ] **Action:** Type `exit` and press Enter
- [ ] **Expected:** Prints "Exiting REPL..." and "Goodbye!", then exits
- [ ] **Pass/Fail:** ______

#### Test Case 4: Quit Alias
- [ ] **Action:** Type `quit` and press Enter
- [ ] **Expected:** Same behavior as `exit`
- [ ] **Pass/Fail:** ______

#### Test Case 5: Ctrl+C
- [ ] **Action:** Press Ctrl+C
- [ ] **Expected:** Prints "Goodbye!" and exits cleanly
- [ ] **Pass/Fail:** ______

#### Test Case 6: Unknown Command
- [ ] **Action:** Type `foo` and press Enter
- [ ] **Expected:** Shows error: "Unknown command 'foo'" and suggests help
- [ ] **Pass/Fail:** ______

#### Test Case 7: Empty Input
- [ ] **Action:** Press Enter without typing anything
- [ ] **Expected:** Shows prompt again (no error)
- [ ] **Pass/Fail:** ______

#### Test Case 8: Command with Arguments
- [ ] **Action:** Type `help extra args` and press Enter
- [ ] **Expected:** Runs help command (ignores extra args for now)
- [ ] **Pass/Fail:** ______

#### Test Case 9: Multiple Commands
- [ ] **Action:** Type `help`, then `help` again, then `exit`
- [ ] **Expected:** Each command works in sequence
- [ ] **Pass/Fail:** ______

#### Test Case 10: Case Insensitivity
- [ ] **Action:** Type `HELP`, `Help`, `EXIT`
- [ ] **Expected:** Commands work regardless of case
- [ ] **Pass/Fail:** ______

---

### Testing Script

Create a simple bash script for regression testing:

```bash
#!/bin/bash
# test-repl.sh - Basic REPL testing

echo "Testing REPL Phase 1..."
echo ""

# Test 1: Help command
echo "Test 1: Help command"
echo "help" | npm run repl 2>&1 | grep -q "Available commands"
if [ $? -eq 0 ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL"
fi

# Test 2: Exit command
echo "Test 2: Exit command"
echo "exit" | npm run repl 2>&1 | grep -q "Goodbye"
if [ $? -eq 0 ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL"
fi

# Test 3: Unknown command
echo "Test 3: Unknown command"
echo "foobar" | npm run repl 2>&1 | grep -q "Unknown command"
if [ $? -eq 0 ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL"
fi

echo ""
echo "Testing complete."
```

---

## Success Criteria

Phase 1 is considered **COMPLETE** when all of the following are true:

### Functional Requirements
✅ **F1:** REPL starts and shows `plugin> ` prompt  
✅ **F2:** User can type commands and press Enter  
✅ **F3:** `help` command displays available commands  
✅ **F4:** `exit` or `quit` command exits cleanly  
✅ **F5:** Ctrl+C exits cleanly with "Goodbye!" message  
✅ **F6:** Unknown commands show "Command not found" error  
✅ **F7:** Empty input (just Enter) shows prompt again  
✅ **F8:** REPL doesn't crash on any input  

### Non-Functional Requirements
✅ **NF1:** Code is fully commented (JSDoc + inline comments)  
✅ **NF2:** TypeScript compiles without errors  
✅ **NF3:** No external dependencies (only Node.js built-ins)  
✅ **NF4:** Code follows existing project style (matches tsconfig.json settings)  
✅ **NF5:** All manual test cases pass  

### Documentation Requirements
✅ **D1:** This implementation plan document exists  
✅ **D2:** Code includes usage examples in comments  
✅ **D3:** `package.json` has `"repl"` script  

---

## Bridge to Phase 2

Phase 1 establishes foundation patterns that Phase 2 will build upon. Here's how Phase 1 prepares for future enhancements:

### Design Patterns to Include Now

#### 1. **Command Router Pattern**

The `handleCommand()` method uses a switch statement that can easily evolve into a command registry:

```typescript
// Phase 1: Hardcoded switch
switch (command) {
  case 'exit': /* ... */ break;
  case 'help': /* ... */ break;
}

// Phase 2: Dynamic registry
const handler = this.commandRegistry.get(command);
if (handler) {
  handler.execute(args, context);
}
```

**Rationale:** The routing logic is isolated in one place, making it easy to replace.

---

#### 2. **Separate Command Handlers**

Each command has its own private method (`commandExit()`, `commandHelp()`):

```typescript
// Phase 1: Simple methods
private commandExit(): void { /* ... */ }
private commandHelp(): void { /* ... */ }

// Phase 2: Replace with command objects
class ExitCommand implements REPLCommand {
  execute(args: string[], context: REPLContext): void { /* ... */ }
}
```

**Rationale:** Each handler is a pure function, making it easy to extract into classes later.

---

#### 3. **Centralized Input Processing**

The `handleCommand()` method already:
- Trims input
- Splits into parts
- Handles errors

This won't change in Phase 2—only the routing logic changes.

---

#### 4. **Lifecycle Hooks (Implicit)**

Phase 1 has explicit lifecycle stages:
- `start()` → Initialization
- `handleCommand()` → Command execution
- `shutdown()` → Cleanup

Phase 2 will add hook firing at these points:

```typescript
// Phase 2: Add hooks
public start(): void {
  this.hooks.trigger('repl:startup');
  // ... existing code
}
```

**Rationale:** Lifecycle stages are already well-defined with single-responsibility methods.

---

#### 5. **Error Handling Pattern**

Phase 1 wraps command execution in try-catch:

```typescript
try {
  // Command execution
} catch (error) {
  // Error handling
}
```

Phase 2 will enhance this to:
- Log errors to Logger
- Emit error events
- Show user-friendly messages

The structure stays the same, just more sophisticated.

---

### What Changes in Phase 2?

| Phase 1 | Phase 2 |
|---------|---------|
| Hardcoded commands | `CommandRegistry` with dynamic registration |
| No services | Inject `Logger`, `Config`, `PluginManager`, etc. |
| No plugins | Load plugins, trigger hooks, register plugin commands |
| No history | `SessionManager` with history persistence |
| No auto-completion | `AutoCompleter` + completion providers |
| Basic prompt | Colored prompt, multi-line support |
| Exit on Ctrl+C | Graceful plugin shutdown sequence |

---

### Refactoring Plan (Phase 1 → Phase 2)

**Step 1:** Extract command handlers into separate classes  
**Step 2:** Create `CommandRegistry` and register hardcoded commands  
**Step 3:** Add `REPLContext` object to pass services to commands  
**Step 4:** Bootstrap core services before starting REPL  
**Step 5:** Initialize `PluginManager` and trigger `repl:startup` hook  
**Step 6:** Add `SessionManager` for history  
**Step 7:** Add `AutoCompleter` for Tab completion  

**Key Insight:** Phase 1's `MinimalREPL` class will become `REPLController` in Phase 2 with minimal changes to its structure—just added dependencies.

---

### Code Evolution Example

**Phase 1: MinimalREPL.ts**
```typescript
class MinimalREPL {
  start() { /* ... */ }
  handleCommand(input: string) { /* ... */ }
  commandHelp() { /* ... */ }
  commandExit() { /* ... */ }
  shutdown() { /* ... */ }
}
```

**Phase 2: REPLController.ts**
```typescript
class REPLController {
  constructor(
    private registry: CommandRegistry,
    private session: SessionManager,
    private services: CoreServices // Logger, Config, etc.
  ) {}
  
  start() { /* Same structure, add hook triggers */ }
  handleCommand(input: string) { /* Same structure, use registry */ }
  shutdown() { /* Same structure, add plugin cleanup */ }
}
```

**Notice:** The method signatures and lifecycle don't change—only the internals.

---

### Why This Approach Works

1. **Incremental Complexity:** Phase 1 proves the core loop works before adding plugins
2. **Risk Mitigation:** If readline doesn't work as expected, we find out early
3. **Learning:** Developers understand the REPL flow before adding abstractions
4. **Quick Feedback:** We can demo Phase 1 to stakeholders in hours, not days

---

## Appendix: Quick Reference

### File Checklist

- [ ] `src/cli/MinimalREPL.ts` created
- [ ] `src/cli/repl-entry.ts` created
- [ ] `package.json` updated with `"repl"` script
- [ ] All code commented
- [ ] Manual tests passed

### Commands Implemented

| Command | Aliases | Description |
|---------|---------|-------------|
| `help` | - | Show available commands |
| `exit` | `quit` | Exit the REPL |

### Key Dependencies

- **readline:** Node.js built-in module for line-by-line input
- **process:** Node.js built-in for stdin/stdout/exit

### Known Limitations

- No command history (up/down arrows don't work)
- No Tab completion
- No multi-line input
- No plugin support
- No color output

**All of these will be addressed in Phase 2.**

---

## Next Steps

After Phase 1 is complete:

1. **Demo:** Show Phase 1 to team/stakeholders
2. **Feedback:** Gather input on prompt format, error messages, UX
3. **Plan Phase 2:** Review [repl-architecture-overview.md](repl-architecture-overview.md) and create Phase 2 plan
4. **Decision Point:** Choose Phase 2 priority (plugin integration vs. UX features)

---

**Document Prepared By:** Hayman (Strategic Technical Planning Agent)  
**Review Status:** Ready for Implementation  
**Estimated Implementation Time:** 2-4 hours
