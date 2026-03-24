#!/usr/bin/env node

/**
 * REPL Entry Point
 * 
 * Standalone executable for launching the plugin-extensible REPL.
 * 
 * Usage:
 *   ts-node src/cli/repl-entry.ts
 *   node dist/cli/repl-entry.js
 *   npm run repl
 */

import { EnhancedREPL } from './repl/EnhancedREPL';

// Create and start REPL
const repl = new EnhancedREPL();
repl.start().catch((error) => {
  console.error('Failed to start REPL:', error);
  process.exit(1);
});
