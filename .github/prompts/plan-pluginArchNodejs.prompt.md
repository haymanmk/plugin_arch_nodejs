# Plan: CLI Tool Hub with Plugin Architecture

**TL;DR:** A fully TypeScript, heavily-commented Node.js CLI app where the core just bootstraps Commander.js — every command comes from a plugin. Covers all article concepts: hooks, plugin manager, message bus, service container, sandboxing, config schemas, and Jest tests.

---

## Project Structure
```
plugin_arch_nodejs/
├── package.json            deps + npm scripts
├── tsconfig.json           CommonJS, ES2020, covers src/ + plugins/
├── jest.config.js
├── src/
│   ├── index.ts            entry point — wires everything
│   ├── types/plugin.ts     Plugin interface, PluginMetadata, PluginContext
│   ├── hooks/HookRegistry.ts   filter (trigger) + action (broadcast) hooks
│   ├── bus/MessageBus.ts       inter-plugin pub/sub
│   ├── sandbox/PluginSandbox.ts  vm-based isolation
│   ├── core/
│   │   ├── Logger.ts           chalk-colored logger
│   │   ├── Config.ts           namespaced key-value store
│   │   └── ServiceContainer.ts simple DI container
│   └── plugins/PluginManager.ts lifecycle + topological sort
└── plugins/
    ├── base-formatter/     shared formatter service (no commands; loaded first)
    ├── hello-world/        `hello [name]` — depends on base-formatter
    ├── file-stats/         `stats <path>` — depends on base-formatter
    └── timestamp/          `time [--format]`
tests/
    HookRegistry.test.ts, MessageBus.test.ts, PluginManager.test.ts, plugins/hello-world.test.ts
```

---

## Phases & Steps

### Phase 1 — Config files *(independent)*
1. `package.json` — runtime deps: `commander`, `chalk@4`; dev: `typescript`, `ts-node`, `ts-jest`, `jest`, `@types/node`, `@types/jest`
2. `tsconfig.json` — CommonJS, ES2020, strict, includes `src/**` and `plugins/**`
3. `jest.config.js` — ts-jest preset

### Phase 2 — Core types & services *(independent, parallel)*
4. `src/types/plugin.ts` — `PluginMetadata` (name, version, deps, configSchema), `PluginContext`, `Plugin` interface
5. `src/core/Logger.ts`, `Config.ts`, `ServiceContainer.ts`

### Phase 3 — Hook system & MessageBus *(depends on Phase 2 types)*
6. `src/hooks/HookRegistry.ts` — priority-ordered `.trigger()` (filter chain) + `.broadcast()` (parallel)
7. `src/bus/MessageBus.ts` — subscribe/publish with error isolation, returns unsubscribe fn
8. `src/sandbox/PluginSandbox.ts` — `vm.createContext` with global allowlist + timeout

### Phase 4 — Plugin Manager *(depends on Phase 2 & 3)*
9. `src/plugins/PluginManager.ts` — `discoverPlugins` (readdir), `loadPlugin` (dynamic import), `resolveDependencyOrder` (topological DFS + cycle detection), `initializeAll`, `disable/enable`, `shutdown`

### Phase 5 — Core CLI entry point *(depends on Phase 4)*
10. `src/index.ts` — wires Logger, Config, ServiceContainer, MessageBus, PluginManager; triggers hooks: `cli:startup`, `cli:register-commands`, `cli:shutdown`; Commander parses argv

### Phase 6 — Plugins *(depends on Phase 4, parallel with each other)*
11. `plugins/base-formatter/index.ts` — registers `Formatter` service in container; subscribes to `command:executed`; prints usage stats on `cli:shutdown`
12. `plugins/hello-world/index.ts` — adds `hello [name]`; uses Formatter; publishes `command:executed`; *depends on `base-formatter`*
13. `plugins/file-stats/index.ts` — adds `stats <path>` with `fs.stat`; *depends on `base-formatter`*
14. `plugins/timestamp/index.ts` — adds `time [--format iso|locale|unix]`; config-driven default format

### Phase 7 — Tests
15. `tests/HookRegistry.test.ts` — filter chain, broadcast, priority, unregister
16. `tests/MessageBus.test.ts` — subscribe/publish, error isolation, unsubscribe
17. `tests/PluginManager.test.ts` — dep ordering, circular dep exception
18. `tests/plugins/hello-world.test.ts` — initialize registers hook, command fires

---

## Hook Events

| Hook | Style | Purpose |
|---|---|---|
| `cli:startup` | broadcast | Plugins do post-init work |
| `cli:register-commands` | filter (passes `commander.Command`) | Plugins attach their subcommands |
| `cli:shutdown` | broadcast | Cleanup; base-formatter prints summary |
| `command:before` / `command:after` | broadcast | Pre/post command lifecycle |

## MessageBus
`command:executed` published by each plugin → `base-formatter` tallies usage

## Plugin Dependency Order
`base-formatter` → `hello-world`, `file-stats` → (all depend on base-formatter); `timestamp` → none

---

## Verification
1. `npm install` — clean install
2. `npx ts-node src/index.ts --help` → shows `hello`, `stats`, `time` from plugins
3. `npx ts-node src/index.ts hello World` → formatted greeting
4. `npx ts-node src/index.ts stats ./src` → file system info
5. `npx ts-node src/index.ts time --format=iso` → ISO timestamp
6. Exit → base-formatter prints command usage summary table
7. `npm test` → all 4 test suites pass

---

## Decisions
- **Chalk v4** (not v5) — stays in CommonJS, avoids ESM complexity
- **Plugins at `/plugins/` root** — simulates "drop-in" extensibility; PluginManager uses `path.join(process.cwd(), 'plugins')`
- **Sandbox is demonstrated**, but real plugins run as trusted (not sandboxed by default)
- **Plugin config** lives in a `config.json` at project root, read by `Config` on startup
