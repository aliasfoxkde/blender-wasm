# 01 Optimized Architecture

## Problem With The Current Direction

The current project started with a full "Blender in the browser" product shape before it had a real browser render artifact. That caused three problems:

1. The frontend could look like Blender while running only minimal WASM.
2. Build work drifted into stubs and placeholder claims.
3. Full Blender build complexity was pulled in before a smaller real render milestone existed.

The efficient approach is to separate:

- build system;
- browser runtime;
- product UI;
- full interactive Blender.

## Recommended Product Slices

### Slice A: Current Honest Baseline

Purpose: prove the app can load real Blender-derived WASM.

Status: already present.

Includes:

- core bridge;
- `clog`;
- `guardedalloc`;
- `bf_dna`;
- `bf_blenlib`;
- browser diagnostics.

Does not include:

- render output;
- scene data;
- viewport;
- `.blend` loading.

### Slice B: Real Render MVP

Purpose: prove the browser can run a real Blender-family render operation.

Preferred target: headless Cycles CPU renderer compiled to WASM.

Why this is preferred:

- avoids Blender editor UI;
- avoids GHOST/windowing;
- avoids WebGPU initially;
- produces objective output pixels;
- can be verified with Playwright pixel checks;
- is still real Blender-family rendering.

### Slice C: Blender Command Runtime

Purpose: run a real Blender CLI-style WASM module in the browser.

Includes:

- Blender runtime assets;
- Python runtime if needed;
- WasmFS;
- asset staging;
- command/script execution;
- output file verification.

### Slice D: Interactive Blender UI

Purpose: real viewport/editor interaction.

Includes:

- WebGPU backend;
- OffscreenCanvas;
- pthread proxying;
- browser GPU device handoff;
- asynchronous readback strategy;
- large artifact packaging.

Do not begin Slice D until Slice B or C has a browser test proving real output.

## Build Architecture

Use two build tracks.

### Track 1: Existing Minimal Docker Build

Use only for:

- maintaining current minimal bridge;
- maintaining blenlib bridge;
- quick artifact audits;
- small targeted Blender library experiments.

Do not use it as the production full Blender plan.

Commands must be resource-limited:

```bash
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g ./scripts/build-blender-wasm.sh blenlib-module
```

### Track 2: Real Render Build Harness

Use for:

- Cycles standalone;
- dependency sysroot;
- browser-ready render module;
- large artifact packaging.

This track should be separate from the current Docker script until it is proven. Suggested location:

```text
real-render/
  README.md
  Makefile
  cmake/
  scripts/
  web/
```

If using files adapted from `https://github.com/heyputer/blender-wasm`, record the exact upstream commit SHA and preserve license notices.

## Runtime Architecture

Frontend runtime should support three module classes:

```text
baseline
  Existing minimal diagnostics.

blenlib
  Existing blenlib diagnostics.

real-render
  New Cycles/browser render artifact.
```

Do not overload `BlenderBlenlibRuntime` with renderer behavior. Add a separate runtime class:

```text
src/runtime/RealRenderRuntime.ts
```

Expected responsibilities:

- locate render artifacts;
- load JS glue;
- instantiate WASM;
- expose progress state;
- run one render command;
- return output image bytes or image URL;
- expose diagnostic errors.

## Artifact Architecture

Small checked-in artifacts are allowed only for the current baseline. Large render artifacts should be external release artifacts unless explicitly approved.

Expected render artifact set:

```text
real-render.js
real-render.wasm.zst
real-render.data or assets.tar.zst
manifest.json
```

The manifest must include:

```json
{
  "version": "string",
  "engine": "cycles-standalone",
  "source_ref": "git sha",
  "emscripten": "version",
  "artifacts": {
    "js": { "path": "real-render.js", "bytes": 0 },
    "wasm_zst": { "path": "real-render.wasm.zst", "compressed_bytes": 0, "decompressed_bytes": 0 },
    "assets_zst": { "path": "assets.tar.zst", "compressed_bytes": 0, "decompressed_bytes": 0 }
  }
}
```

## Browser Headers

Any pthread build requires cross-origin isolation:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: cross-origin
```

The dev server, preview server, and production host must all set these headers before pthread WASM is enabled.

