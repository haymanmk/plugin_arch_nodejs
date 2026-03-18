#!/usr/bin/env node
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const MinimalREPL_1 = require("./MinimalREPL");
// Create and start REPL
const repl = new MinimalREPL_1.MinimalREPL();
repl.start();
//# sourceMappingURL=repl-entry.js.map