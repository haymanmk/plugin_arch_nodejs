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
