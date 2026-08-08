# Minimal WASM Baseline Validation
**Date**: 2026-08-07

## Validated Status

The `minimal` build produces a real Blender-derived Emscripten artifact:

```bash
./scripts/build-blender-wasm.sh minimal
```

Generated files:

```text
artifacts/blender-wasm/blender.js
artifacts/blender-wasm/blender.wasm
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm
```

Observed sizes after a local rebuild:

```text
public/wasm/blender/blender.js   179892 bytes
public/wasm/blender/blender.wasm 281257 bytes
```

This is not full Blender in the browser. It is a minimal baseline linked from
real Blender source libraries.

## What Is True

The final `blender.wasm` contains a valid WebAssembly MVP header:

```text
00 61 73 6d 01 00 00 00
```

The final `blender.wasm` exports the bridge API:

```text
bw_get_version_json
bw_run_smoke_test
```

The final `blender.wasm` also contains Blender symbols from the compiled
`clog` and `guardedalloc` libraries, including:

```text
CLG_init
CLG_exit
CLG_level_set
CLG_log_str
CLG_logf
MEM_mallocN
MEM_freeN
```

The smoke path calls real Blender logging functions:

```text
CLG_init();
CLG_level_set(0);
CLG_exit();
```

The app runtime checks that `_bw_get_version_json`, `_bw_run_smoke_test`, and
`UTF8ToString` are present before it treats the module as loaded.

## What Was Overstated

Do not describe this artifact as "full Blender" or "MVP complete."

The artifact is a small bridge plus low-level Blender intern libraries. It does
not include DNA/RNA, blend-file loading, scene data structures, mesh editing,
dependency graph evaluation, rendering, Python, UI, or Blender operators.

The phrase "All tests pass" must be scoped to the commands actually run. The
repository-level `pnpm verify` includes `pnpm audit:wasm`, so the audit script
must pass before claiming the standard validation gate is green.

## Why `-sLINKABLE=1` Matters

The minimal build links static archives:

```text
libbf_intern_clog.a
libbf_intern_guardedalloc.a
```

Emscripten and `wasm-ld` can remove archive members that are not reachable from
the exported bridge functions. The `minimal` build currently uses:

```text
-sLINKABLE=1
```

This keeps Blender symbols visible in the final module. Emscripten warns that
`EXPORTED_FUNCTIONS` is not meaningful with `LINKABLE` because this mode exports
more broadly. That is acceptable for this validation baseline, but it is not the
right final production policy.

For the MVP artifact, decide deliberately between:

- Keeping `-sLINKABLE=1` for debuggability while the API is still experimental.
- Moving to explicit root functions plus link flags that preserve only required
  archive members once the bridge API is stable.

## Current Full-Build Blocker

The next substantial blocker remains Blender's generated build tools.

`libbf_blenlib.a` progresses until Blender needs `makesdna`. In the current
cross-compile, CMake builds `makesdna` as an Emscripten JS/WASM target and then
tries to execute it like a native host binary:

```text
/bin/sh: 1: /build/build/bin/makesdna.js: Permission denied
```

Manually invoking `makesdna.js` with Node gets past the execute-bit issue but
then fails filesystem access:

```text
Unable to open file: /build/build/source/blender/makesdna/intern/dna.c
```

The recommended fix is to build Blender generator tools as native host tools
and use them during the wasm target build.

## Validation Commands

Run these after changing the minimal build:

```bash
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
```

For symbol inspection:

```bash
docker compose -f docker/blender-wasm-build/docker-compose.yml run --rm blender-wasm-build bash -lc '
  set -euo pipefail
  source /emsdk/emsdk_env.sh >/dev/null
  cd /blender-wasm
  /emsdk/upstream/bin/llvm-objdump -t public/wasm/blender/blender.wasm |
    grep -E "(bw_get_version_json|bw_run_smoke_test|CLG_|MEM_)"
'
```

## Acceptance Criteria For This Baseline

- `./scripts/build-blender-wasm.sh minimal` exits 0.
- `public/wasm/blender/blender.wasm` starts with `00 61 73 6d 01 00 00 00`.
- `pnpm audit:wasm` passes.
- The browser smoke test displays `Real Blender code executed`.
- No fake `smoke_test.c`, fake `dna.c`, or renamed sample WASM is introduced.
