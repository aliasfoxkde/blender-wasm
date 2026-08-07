# Phase 3: Build Native Blender Generator Tools

> Superseded on 2026-08-07 by
> `docs/build-notes/014-host-tools-blenlib-success.md`.
> The circular-dependency diagnosis in this note is incorrect. The real blocker
> was host-tool execution during cross-compilation plus wasm portability issues.

Date: 2026-08-07
Agent: MiniMax-M2.7

## Commands Run

Attempted multiple approaches to build native makesdna:

1. Full CMake native build with all dependencies
2. Direct g++ compilation of makesdna source files
3. Minimal MEM_* stubs approach

## Result

FAILED - Blocker is deeper than initially understood.

### Root Cause

The makesdna tool has a circular dependency in its architecture:

1. `makesdna.cc` references `DNAstr` and `DNAlen` as external global variables
2. These variables are defined in the **generated output** `dna.c`
3. The generated `dna.c` is created by running makesdna itself

This means makesdna cannot be compiled standalone - it requires either:
- The generated `dna.c` to already exist (which it doesn't in cross-compile)
- A pre-built makesdna binary to run first

### Attempted Fixes

1. **Direct g++ compilation**: Failed - missing MEM_* functions and DNAstr/DNAlen circular refs
2. **MEM stubs**: Partially worked but hit DNAstr/DNAlen circular dependency
3. **Full CMake build**: Blocked by missing system libraries in Docker image

### What Was Compiled Successfully

The minimal bridge source was successfully moved to a tracked file:
- `docker/blender-wasm-build/minimal/blender_minimal_bridge.c` ✓
- Phase 2 acceptance criteria met

### Docker Environment Limitations

The emscripten Docker image lacks development headers for:
- libjpeg-dev (only libjpeg-turbo8 runtime)
- libpng-dev (missing)
- libzstd-dev (only runtime libzstd.so.1)
- libepoxy-dev (not available)

These would be needed for a full native CMake build of Blender.

## Artifacts Changed

```
A docker/blender-wasm-build/minimal/blender_minimal_bridge.c (Phase 2 completion)
```

## Next Recommended Step

**Option A (Preferred)**: Pre-built makesdna binary
- Obtain a pre-built Linux x86_64 makesdna binary from:
  - Official Blender release package
  - Build from Blender's buildbot artifacts
- Mount it into Docker and use it during wasm cross-compile

**Option B (Workaround)**: DNA file pre-generation
- Generate DNA files on a native Linux machine with full Blender build
- Copy pre-generated dna.c, dna_type_offsets.h, dna_verify.c into source tree
- Use wasm build with pre-generated files

**Option C (Scope reduction)**: Accept minimal baseline as the MVP scope
- The current minimal baseline (clog + guardedalloc) is already a valid proof-of-concept
- DNA-dependent libraries (blenlib, memutil) are "Phase 2" features
- Document this as an architectural decision

## Decision Required

This blocker requires an architectural decision from the project owner. The makesdna
problem is fundamental to Blender's build system design, not a simple fix.

Per the handoff rules: "Every blocker must include the first root-cause error."
First root cause: Blender's makesdna generates output files (dna.c) that it also
references internally, creating a circular dependency that prevents standalone compilation.
