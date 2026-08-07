# Next Technical Branch Decision

**Date**: 2026-08-07

## Decision: Headless Blender Operations

We choose **Option 1: Headless Blender operations** as the next technical branch.

## Rationale

### What blocks full Blender WASM

1. **Emscripten tool permission issue**: `datatoc.js` and `makesdna.js` (Emscripten-compiled build tools) fail with "Permission denied" when trying to run. They use a virtual filesystem overlay and cannot read actual source files.

2. **GHOST/windowing system**: Blender's GHOST subsystem requires native window management. Even with Emscripten, running a full desktop UI in a browser tab is architecturally mismatched.

3. **Binary size**: Full Blender is hundreds of MB - impractical for browser download.

### What works

1. **CMake configure succeeds** - all stub modules resolve correctly
2. **Individual static libraries build** - `bf_intern_*` libraries compile fine
3. **Emscripten toolchain works** - can compile C to WASM (verified with smoke test)
4. **Browser loads WASM** - our smoke test artifact runs in Chromium

### Headless Operations Approach

Instead of fighting Blender's architecture, leverage what works:

1. **Compile Blender source to static library** (`.a`/`.wasm`)
2. **Link against our own Emscripten entrypoint** that exposes:
   - `BKE_blender_version()` - version info
   - `BKE_main_scene_new()` - create scene
   - `BKE_main_mesh_add()` - add cube mesh
   - `BKE_scene_to_json()` - serialize scene to JSON
3. **Load this library via Emscripten JS loader**
4. **Call functions via `ccall`/`cwrap`**

This gives us:
- Real Blender source code running in browser
- Useful output (scene data, version info)
- No GHOST/UI complications
- Incremental progress toward full Blender

### Implementation Steps (Next Phase)

1. Create `docker/blender-wasm-build/mvp-smoke/` with custom entrypoint
2. Write C wrapper that links Blender source and exports narrow API
3. Compile with Emscripten: `emcc -sLINKABLE=1 ...`
4. Export `bw_version_json()`, `bw_create_scene()`, `bw_add_cube()`
5. Update `EmscriptenBlenderRuntime` to call these functions
6. Display version/build info in UI

### Why Not Minimal Viewport

A minimal viewport (cube in WebGL) is desirable but:
- Requires GLSL shader compilation
- Needs real-time render loop
- WebGL context sharing with Emscripten canvas is complex
- Headless operations give us MVP "proof" faster

After headless is stable, we can layer WebGL preview on top.

## Evidence

Build log from 2026-08-07:
```
[1/4259] Generating engines/eevee_next/shaders/eevee_film_cryptomatte_post_comp.glsl.c
FAILED: source/blender/draw/engines/eevee_next/shaders/eevee_film_cryptomatte_post_comp.glsl.c 
/bin/sh: 1: /build/build/bin/datatoc.js: Permission denied
```

CMake configure succeeded, individual library targets build, but shader generation tools fail due to Emscripten virtual filesystem limitation.
