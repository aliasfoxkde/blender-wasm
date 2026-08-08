# 05 Full Blender Later

This document defines the later path to full Blender. Do not start here.

## Entry Criteria

Only begin this path after at least one of these is true:

1. Headless Cycles render MVP works in browser and has pixel tests.
2. Blender CLI-style WASM runtime executes a script in browser and produces a verified output file.

If neither is true, return to `02-phase-plan-real-render-mvp.md`.

## Full Blender Requirements

Full Blender in browser needs:

- `WITH_BLENDER=ON`;
- Python runtime;
- Blender scripts;
- Blender release datafiles;
- filesystem mounting;
- pthreads;
- cross-origin isolation;
- browser-specific relink;
- large memory settings;
- WebGPU or another real graphics backend;
- runtime asset packaging;
- browser tests with screenshots and pixels.

## Phase F1: Full Blender Configure

Goal: configure full Blender without editor viewport claims.

Required cache options:

```cmake
set(WITH_BLENDER ON CACHE BOOL "")
set(WITH_PYTHON ON CACHE BOOL "")
set(WITH_PYTHON_MODULE OFF CACHE BOOL "")
set(WITH_PYTHON_INSTALL OFF CACHE BOOL "")
set(WITH_LIBS_PRECOMPILED OFF CACHE BOOL "")
set(WITH_STRICT_BUILD_OPTIONS OFF CACHE BOOL "")
set(WITH_OPENGL_BACKEND OFF CACHE BOOL "")
set(WITH_VULKAN_BACKEND OFF CACHE BOOL "")
set(WITH_GHOST_X11 OFF CACHE BOOL "")
set(WITH_GHOST_WAYLAND OFF CACHE BOOL "")
set(WITH_GHOST_SDL OFF CACHE BOOL "")
set(WITH_TESTS OFF CACHE BOOL "")
set(WITH_GTESTS OFF CACHE BOOL "")
```

Acceptance:

- configure completes on heavy builder;
- generated host tools run correctly;
- no native host binary is linked into WASM output.

## Phase F2: Python And Assets

Goal: provide real runtime files.

Tasks:

1. Build or import wasm CPython.
2. Stage Python stdlib.
3. Stage Blender `scripts`.
4. Stage Blender `release/datafiles`.
5. Remove tests, caches, and unused Python modules from staged assets.
6. Create `assets.tar.zst`.
7. Generate manifest with decompressed size.

Acceptance:

- browser can mount assets;
- Blender finds scripts and datafiles;
- startup does not fail from missing Python stdlib.

## Phase F3: CLI Runtime In Browser

Goal: run Blender command-line behavior in browser before UI.

Tasks:

1. Relink CMake's Blender target for web.
2. Remove node-only flags.
3. Use:

   ```text
   -pthread
   -sPROXY_TO_PTHREAD=1
   -sWASMFS
   -sFORCE_FILESYSTEM=1
   -sALLOW_MEMORY_GROWTH=1
   -sINITIAL_MEMORY=1073741824
   -sMAXIMUM_MEMORY=4294967296
   -sEXPORTED_RUNTIME_METHODS=FS,callMain,ccall,cwrap,ENV,HEAPU8,HEAPU16,HEAPF32
   -sENVIRONMENT=web,worker
   ```

4. Add a browser test that runs a script:

   ```python
   import bpy
   bpy.ops.mesh.primitive_cube_add()
   bpy.ops.wm.save_as_mainfile(filepath="/tmp/proof.blend")
   ```

5. Verify `/tmp/proof.blend` exists and has nonzero size.

Acceptance:

- Playwright test passes in browser.
- Output file is created by real Blender WASM.

## Phase F4: WebGPU Viewport

Goal: render real Blender UI/viewport pixels.

Tasks:

1. Enable or port WebGPU backend.
2. Acquire `navigator.gpu` adapter/device in JS.
3. Pass device into WASM using the selected Emscripten WebGPU path.
4. Use OffscreenCanvas for render thread.
5. Handle browsers without WebGPU with a hard unsupported state.
6. Add screenshot tests.

Acceptance:

- canvas exists only when real WebGPU-backed Blender rendering is active;
- pixel test fails for a blank canvas, grid, cube placeholder, or clear color;
- UI copy says exactly what backend is active.

## Phase F5: Editing Features

Do not add editing features until F4 passes.

Feature order:

1. Open default scene.
2. Select object.
3. Transform object.
4. Save file.
5. Load saved file.
6. Import simple asset.
7. Material edit.
8. Render final image.

Each feature needs a browser test. No test, no completion claim.

