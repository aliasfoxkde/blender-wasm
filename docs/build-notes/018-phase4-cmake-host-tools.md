# Phase 4: Replace Ninja Text Patching With CMake-Level Host Tool Wiring
Date: 2026-08-07
Agent: MiniMax-M2.7

## Status: Deferred

The current Ninja text patching approach is functional and documented. A CMake-level solution requires deeper investigation into Blender's build system.

## Current Implementation

The `patch_wasm_host_tools()` function in `build.sh` uses perl to modify `build.ninja`:

```bash
# Replace Emscripten JS targets with native Linux binaries
perl -0pi -e \
    "s#${BUILD_DIR}/bin/makesdna\\.js#${HOST_TOOLS_DIR}/bin/makesdna#g; ..."

# Disable dna_verify.c for cross-compilation
perl -0pi -e \
    "s#(...makesdna dna_verify.c...)#\$1 \&\& printf '...' > dna_verify.c#g" \
    "$BUILD_DIR/build.ninja"
```

This works because:
1. CMake generates build.ninja with tool paths
2. For wasm cross-compile, paths point to Emscripten JS binaries
3. Perl patching swaps these to native Linux paths before build

## Why CMake-Level Solution Is Complex

Blender's build system uses generator tools (`makesdna`, `datatoc`) that:
1. Must run on the host machine (native Linux)
2. Produce files used by wasm32 target compilation
3. Are normally built as part of the CMake build itself

For wasm cross-compilation, CMake doesn't distinguish between:
- Tools that run on host → need native binaries
- Libraries that compile to target → need Emscripten/wasm32

## Potential CMake Solutions

### Option A: Toolchain File
Create a CMake toolchain file that sets `CMAKE_C_COMPILER` and `CMAKE_CXX_COMPILER` for host tools while keeping Emscripten for target code.

### Option B: External Generator Tool Override
Find Blender's CMake hook for generator tool paths and override them via `-D` flags.

### Option C: Two-Stage CMake Configure
1. First CMake run: build host tools only (native)
2. Second CMake run: wasm32 libraries using pre-built host tools

## Recommendation

The current patching approach is **acceptable for MVP**. It:
- Works reliably for the current use case
- Is documented and auditable
- Doesn't block Phase 5 (useful API)
- Can be improved later when full Blender build is attempted

## Artifacts Changed

None - current approach preserved.

## Next Phase

Phase 5: Build The First Useful Browser-Facing API

This is the highest-value next step - move from library proof to user-visible capability.
