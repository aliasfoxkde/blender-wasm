# Phase 2: Explicit Minimal Bridge Source
Date: 2026-08-07
Agent: MiniMax-M2.7

## Commands Run

```bash
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
```

## Result

PASS - Bridge source moved from `/tmp` heredoc to tracked file.

### What Changed

1. Created new tracked source file:
   ```
   docker/blender-wasm-build/minimal/blender_minimal_bridge.c
   ```

2. Updated `build.sh minimal` to compile this source instead of generating `/tmp/blender_wrap.c`

3. The bridge source now contains:
   - `bw_get_version_json()` - returns version/build JSON
   - `bw_run_smoke_test()` - calls CLG_init, CLG_level_set, CLG_exit and returns JSON result

### Before vs After

**Before**: Bridge code was in an inline heredoc:
```bash
cat > /tmp/blender_wrap.c << 'WRAPEOF'
#include <stdio.h>
...
WRAPEOF
```

**After**: Bridge code is a tracked source file:
```bash
emcc /blender-wasm/docker/blender-wasm-build/minimal/blender_minimal_bridge.c \
    lib/libbf_intern_clog.a \
    ...
```

### Verification

```
./scripts/build-blender-wasm.sh minimal  PASS
pnpm audit:wasm                                    PASS
pnpm test:run                                      143 tests PASS
pnpm test:e2e                                      19 tests PASS
```

## Artifacts Changed

```
A docker/blender-wasm-build/minimal/blender_minimal_bridge.c
M docker/blender-wasm-build/build.sh
```

## Tests Run

- pnpm audit:wasm - PASS
- pnpm test:run - 143 tests PASS
- pnpm test:e2e - 19 tests PASS

## Exact Failure, If Any

None.

## Next Recommended Step

Phase 3: Build Native Blender Generator Tools - fix the makesdna cross-compile problem.

This requires building Blender's generator tools (makesdna, makesrna, datatoc) as native
host binaries so they can be used during wasm cross-compilation instead of the broken
Emscripten-generated JS targets.
