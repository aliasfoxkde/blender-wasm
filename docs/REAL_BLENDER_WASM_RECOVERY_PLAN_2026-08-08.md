# Real Blender WASM Recovery Plan

Date: 2026-08-08

This document supersedes any plan that treats a grid/cube preview as Blender
running in the browser. The current app has a real compiled Blender baseline,
but it does not have native Blender scene rendering.

## Current Truth

The committed browser artifacts are useful but limited:

- `public/wasm/blender/blender.*`: core bridge linked to real Blender `clog`
  and `guardedalloc`.
- `public/wasm/blender/blender_blenlib.*`: experimental bridge linked to real
  `bf_blenlib`, `bf_dna`, `clog`, and `guardedalloc`.
- The app must show diagnostics, not a fake 3D viewport, until a real Blender
  render path is wired into the browser.

The prior `makesdna` blocker was not fundamental. Native host-tool generation
has already been proven enough to build `bf_dna` and `bf_blenlib`. The next
blocker is architecture: full Blender rendering is a large build with many
dependencies, browser filesystem requirements, pthreads, and GPU/device
integration.

## Reference Project Audit

Reference: https://github.com/heyputer/blender-wasm

The HeyPuter project uses a more credible production path:

- It pins a Blender fork and Emscripten 6.0.1 in a top-level Makefile.
- Its first MVP target is headless Cycles CPU rendering in the browser, not the
  full interactive Blender UI.
- It builds a real dependency sysroot instead of using broad stubs.
- It treats full Blender/WebGPU as a later phase requiring CPython, Blender
  runtime datafiles, pthreads, cross-origin isolation, staged assets, and a
  browser-specific relink.
- Its workflow warns that a full build is heavy: many GB of build trees, a
  large WASM module, hours of compile time, and swap headroom.

Adopt the architecture, not the marketing. First prove a real browser-visible
render artifact. Only then integrate interactive Blender UI work.

## Resource Policy

Do not run unconstrained Docker builds on the workstation.

Use these defaults unless the owner explicitly provides a stronger machine:

```bash
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g ./scripts/build-blender-wasm.sh <mode>
```

Normal `pnpm verify` must not launch Docker. If a Docker-backed audit is needed,
run it explicitly:

```bash
BLENDER_WASM_ALLOW_DOCKER=1 pnpm audit:blenlib
```

For production Blender builds, prefer GitHub Actions or a self-hosted runner
with at least 4 CPUs, 32 GB RAM, 16 GB swap, and 100 GB free disk. The local
machine should only run frontend tests and small artifact audits.

## MVP Definition

The next honest MVP is one of these, in order of feasibility:

1. Headless Cycles CPU render in browser: load a bundled scene, run real Cycles
   WASM, show the rendered PNG/canvas output.
2. Real Blender command/runtime in browser: run Blender CLI-style WASM with
   assets and Python filesystem mounted, prove a script can create/render a
   scene.
3. Interactive Blender UI/WebGPU: full browser UI with real Blender rendering.

Do not skip directly to option 3 unless option 1 or 2 already produces a real
browser-visible Blender result.

## Phase 0: Lock The Honest Baseline

Goal: keep the app from lying while deeper build work proceeds.

Steps:

1. Verify the viewport has no `<canvas>` placeholder.
2. Verify the diagnostics say `Compiled Blender WASM baseline loaded`.
3. Verify the diagnostics include `Native Blender scene rendering is not in
   this build yet`.
4. Run:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test:run
   pnpm build
   pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
   ```

Acceptance: all commands pass and the e2e test asserts `canvas` count is zero.

## Phase 1: Fork Or Vendor The Real Build Harness

Goal: stop evolving the stub-heavy Docker path as the main production route.

Steps:

1. Record the reference repo commit SHA:

   ```bash
   git ls-remote https://github.com/HeyPuter/blender-wasm.git refs/heads/master
   ```

2. Compare these files and decide whether to vendor them or reimplement them:

   ```text
   Makefile
   cmake/cycles-wasm-cache.cmake
   cmake/blender-wasm-cache.cmake
   cmake/wasm_compat.h
   scripts/build_all_deps.sh
   scripts/dep_common.sh
   scripts/link_cycles_web.sh
   scripts/link_blender_release.sh
   demo/provider_backend.cpp
   demo/provider-fs.js
   demo/localdir_backend.cpp
   demo/localdir_lib.js
   ```

3. Do not mix this with the old Docker script until the dependency sysroot is
   understood. Keep it as a separate `real-render` build path.

Acceptance: a new build note states the exact copied/reference files, the
source commit SHA, and what was intentionally not copied.

## Phase 2: Browser Headless Render First

Goal: produce one real Blender-family rendered image in the browser.

Steps:

1. Add a new target named `cycles-web` or `real-render-web`; do not call it
   `full-blender`.
2. Build the dependency sysroot with pinned Emscripten and matching ABI flags:
   `-pthread`, exceptions, and consistent SIMD decisions.
3. Configure Blender with:

   ```text
   WITH_BLENDER=OFF
   WITH_CYCLES_STANDALONE=ON
   WITH_CYCLES_STANDALONE_GUI=OFF
   WITH_PYTHON=OFF
   WITH_OPENGL_BACKEND=OFF
   WITH_VULKAN_BACKEND=OFF
   ```

4. Relink the generated Cycles executable for the browser with:

   ```text
   -pthread
   -sPROXY_TO_PTHREAD
   -sWASMFS
   -sFORCE_FILESYSTEM=1
   -sALLOW_MEMORY_GROWTH=1
   -sEXPORTED_RUNTIME_METHODS=FS,callMain,ccall,cwrap
   ```

5. Bundle one tiny test scene through `--preload-file`.
6. Add a dedicated route or panel that runs the render and displays the output.

Acceptance:

```bash
pnpm build
pnpm exec playwright test tests/e2e/real-render.spec.ts --project=chromium --workers=1
```

The e2e test must assert non-empty rendered pixels from the real WASM module.

## Phase 3: Asset And Filesystem Runtime

Goal: make the browser runtime capable of loading Blender runtime assets without
mass OPFS extraction or fake file APIs.

Steps:

1. Use zstd-compressed artifacts for large WASM/assets.
2. Add a manifest with decompressed sizes.
3. Stream downloads with progress.
4. Decompress assets into one buffer and mount an indexed tar through a WasmFS
   provider.
5. Keep persistent user files separate from immutable Blender assets.
6. Serve the app with cross-origin isolation headers:

   ```text
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   Cross-Origin-Resource-Policy: cross-origin
   ```

Acceptance: browser startup logs show assets mounted and no per-file extraction
storm into OPFS.

## Phase 4: Full Blender CLI Runtime

Goal: run a real Blender command/script inside the browser runtime.

Steps:

1. Enable `WITH_BLENDER=ON` and `WITH_PYTHON=ON`.
2. Build or import a wasm CPython dependency into the sysroot.
3. Stage `scripts`, `release/datafiles`, and Python stdlib.
4. Relink CMake's Blender output for the browser; remove node-only flags.
5. Export `FS`, `callMain`, `ccall`, `cwrap`, `ENV`, and heap views needed by
   the loader.
6. Add a browser test that runs a Python script to create a scene and save or
   render an output file.

Acceptance: e2e test proves `callMain` executes real Blender code and produces
a verifiable output file.

## Phase 5: Interactive UI/WebGPU

Goal: only after Phase 4, wire interactive browser rendering.

Steps:

1. Enable or port the WebGPU backend.
2. Require browser WebGPU support and show a hard unsupported state otherwise.
3. Use OffscreenCanvas and pthread proxying.
4. Pass the JS WebGPU device into the WASM runtime.
5. Add screenshot/pixel tests proving the canvas is not a placeholder.

Acceptance: the test must fail if the canvas is only a grid, cube, clear color,
or TypeScript-rendered placeholder.

## MiniMax Rules

- Do not run Docker unless the command includes explicit CPU/memory/job limits.
- Do not call a task complete if it only changes documentation.
- Do not create stubs for png, zstd, OIIO, Python, GPU, or filesystem behavior
  and then claim production readiness.
- Do not present WebGL/Three.js output as Blender output.
- Every build phase must include exact command, elapsed time, artifact sizes,
  and a browser verification result.
- If a build fails, document the first compiler/linker error and stop changing
  unrelated frontend code.
