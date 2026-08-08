# Phase 2: Link bf_blenlib Into Experimental WASM Module
Date: 2026-08-07
Updated: 2026-08-08
Agent: MiniMax-M2.7, audited by Codex

## Goal

Create experimental WASM module at `artifacts/blender-wasm/blender_blenlib.js` that proves a public Emscripten module can call real `blenlib` functions.

## Implementation

### 1. Created `docker/blender-wasm-build/blenlib/blender_blenlib_bridge.cc`

New bridge source file providing three exported functions:

```c
const char* bw_blenlib_capabilities_json(void);
// Returns: {"module":"blenlib","functions":[...],"libraries":[...]}

int bw_blenlib_smoke_test(void);
// Returns: 1 on success, 0 on failure
// Tests: CLG_init/exit, BLI_hash_mm2, BLI_strlen_utf8

unsigned int bw_hash_string_mm2a(const char *value);
// Returns: 32-bit MM2A hash of input string
```

### 2. Updated `docker/blender-wasm-build/build.sh`

Added `build_blenlib_module()` function and `blenlib-module` build mode:

```bash
./scripts/build-blender-wasm.sh blenlib-module
```

This builds the blenlib library and links it with the bridge into:
```
artifacts/blender-wasm/blender_blenlib.js
artifacts/blender-wasm/blender_blenlib.wasm
```

Important link policy: the experimental blenlib module must not use
`-sLINKABLE=1`. That mode forces effectively whole-archive linking and pulls
unrelated `bf_blenlib` object files that require optional dependencies such as
fmt, xxhash, and zlib. The module exports the bridge API only and lets wasm-ld
include the archive members actually referenced by the bridge.

### 3. Created `src/runtime/BlenderBlenlibRuntime.ts`

TypeScript wrapper for the blenlib module with methods:
- `load()` - Load the WASM module
- `getCapabilities()` - Get module capabilities JSON
- `runSmokeTest()` - Run smoke test
- `hashStringMm2a(value)` - Hash a string using MM2A
- `isLoaded()` - Check if loaded
- `dispose()` - Free resources

### 4. Updated `src/runtime/index.ts`

Exports `BlenderBlenlibRuntime` and `BlenlibCapabilities` type.

### 5. Updated `scripts/build-blender-wasm.sh`

Added `blenlib-module` build mode.

## Build Requirements

The experimental blenlib module requires Docker to be running since it needs:
- Native host tools (makesdna, datatoc)
- WASM cross-compilation with blenlib libraries

## Verification

```bash
./scripts/build-blender-wasm.sh blenlib-module
```

Verified 2026-08-08:

```text
artifacts/blender-wasm/blender_blenlib.js    65K
artifacts/blender-wasm/blender_blenlib.wasm  35K
```

Additional checks:

```bash
pnpm audit:blenlib
pnpm audit:baselines
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

This is intentionally not run in default CI until Docker runtime cost is
accepted.

## Next Steps

After this phase:

1. Keep `blenlib-module` promoting `blender_blenlib.*` to
   `public/wasm/blender`.
2. Keep the browser UI loading the experimental module only when the artifacts
   are present.
3. Keep the minimal public module as the core bridge runtime; the promoted
   blenlib module is an additional experimental Blender-derived runtime, not a
   native scene renderer.

## Artifacts Changed

```
A docker/blender-wasm-build/blenlib/blender_blenlib_bridge.cc
A src/runtime/BlenderBlenlibRuntime.ts
M docker/blender-wasm-build/build.sh
M scripts/build-blender-wasm.sh
M src/runtime/index.ts
```

## Acceptance Criteria Status

- [x] Experimental artifacts created at `artifacts/blender-wasm/blender_blenlib.*`
- [x] Export inspection/audit detects `bw_blenlib_*`, `BLI_*`, and DNA markers
- [x] Node smoke test calls `bw_blenlib_smoke_test()`
- [x] Existing minimal artifact still auditable via `pnpm audit:wasm`
- [x] Docker build produces the actual WASM file
