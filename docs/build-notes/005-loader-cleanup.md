# Phase 1: Loader Cleanup
Date: 2026-08-07
Agent: MiniMax-M2.7

## Commands Run

```bash
pnpm test:run
pnpm audit:wasm
pnpm test:e2e
```

## Result

PASS - Loader path fixed, Vite warning eliminated.

### Problem

`EmscriptenBlenderRuntime.loadModuleFactory()` first attempted dynamic `import()` of
`/wasm/blender/blender.js`. Vite cannot process `/public` assets through its module
system, causing this error:

```
Failed to load url /wasm/blender/blender.js ... This file is in /public and
will be copied as-is during build without going through the plugin transforms,
and therefore should not be imported from source code.
```

The code already had a script-tag fallback that worked, but the failed import
attempt still logged the warning.

### Solution

Detected when the artifact URL is under `/wasm/blender/` and skip the dynamic
import attempt, going directly to script-tag loading:

```typescript
if (blenderJsUrl.startsWith('/wasm/blender/')) {
  return this.loadModuleFactoryViaScriptTag(blenderJsUrl);
}
```

Extracted script-tag loading into its own method `loadModuleFactoryViaScriptTag()`
for clarity and to avoid code duplication.

### Verification

Before fix: Vite logged 500 warning on every e2e test run.
After fix: No Vite warning about `/wasm/blender/blender.js`.

```
pnpm test:e2e
  19 passed (12.7s)
```

## Artifacts Changed

```
M src/runtime/EmscriptenBlenderRuntime.ts
```

## Tests Run

- pnpm test:run - 143 tests PASS
- pnpm audit:wasm - PASS
- pnpm test:e2e - 19 tests PASS (no Vite warning)

## Exact Failure, If Any

None.

## Next Recommended Step

Phase 2: Make The Minimal Bridge Source Explicit - move `/tmp/blender_wrap.c`
heredoc from `build.sh` into a tracked source file at
`docker/blender-wasm-build/minimal/blender_minimal_bridge.c`.
