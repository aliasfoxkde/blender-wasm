# 02 Phase Plan: Real Render MVP

This is the implementation sequence. Complete phases in order.

## Phase 0: Baseline Lock

Goal: keep the current app honest while render work happens separately.

Tasks:

1. Run:

   ```bash
   git status --short --branch
   pnpm typecheck
   pnpm lint
   pnpm test:run
   pnpm build
   pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
   ```

2. Confirm the browser smoke test asserts:

   ```text
   canvas count is zero
   diagnostics include "Compiled Blender WASM baseline loaded"
   diagnostics include "Native Blender scene rendering is not in this build yet"
   ```

3. If the UI contains a fake viewport, remove it before doing anything else.

Acceptance:

- tests pass;
- no fake render UI exists;
- build note created at `docs/build-notes/021-baseline-lock-before-real-render.md`.

## Phase 1: Create The Real Render Build Area

Goal: create a separate build harness for real browser rendering without disturbing the current app.

Tasks:

1. Create:

   ```text
   real-render/
   real-render/README.md
   real-render/cmake/
   real-render/scripts/
   real-render/web/
   ```

2. Add `real-render/README.md` with:

   - objective;
   - required machine resources;
   - artifact policy;
   - exact setup commands;
   - explicit statement that this is not full Blender UI.

3. Add `real-render/.gitignore`:

   ```text
   emsdk/
   blender/
   deps/
   wasm-sysroot/
   build-cycles/
   web/*.wasm
   web/*.wasm.zst
   web/*.data
   web/*.tar
   web/*.tar.zst
   ```

4. Add a root package script that only validates expected artifact metadata and never builds Blender:

   ```json
   "audit:real-render": "node scripts/audit-real-render-artifacts.mjs"
   ```

Acceptance:

- `pnpm audit:real-render` exists;
- it fails clearly if artifacts are missing;
- it does not invoke Docker, CMake, Ninja, or Emscripten.

## Phase 2: Pin Toolchain And Source

Goal: make the heavy build reproducible.

Tasks:

1. Add `real-render/build.config.env`:

   ```bash
   EMSDK_VERSION=6.0.1
   BLENDER_REMOTE=https://github.com/HeyPuter/blender
   BLENDER_REF=6b031d3d41c392883e3c495aa72343e10d15b43d
   BUILD_JOBS=2
   ```

2. Add `real-render/scripts/setup-toolchain.sh`.

   Required behavior:

   - source `build.config.env`;
   - clone emsdk into `real-render/emsdk` if missing;
   - install and activate the pinned Emscripten version;
   - print `emcc --version`;
   - exit nonzero if `emcc` is missing.

3. Add `real-render/scripts/fetch-blender.sh`.

   Required behavior:

   - source `build.config.env`;
   - initialize `real-render/blender`;
   - fetch only `BLENDER_REF`;
   - checkout detached;
   - skip LFS smudge during checkout;
   - print final commit SHA.

Acceptance:

```bash
bash -n real-render/scripts/setup-toolchain.sh real-render/scripts/fetch-blender.sh
```

Do not run heavy setup locally unless explicitly requested.

## Phase 3: Dependency Sysroot Plan

Goal: define real dependencies instead of stubs.

Tasks:

1. Add `real-render/scripts/dep-common.sh`.

   It must define:

   ```bash
   ROOT
   EMSDK
   EM_BIN
   SYSROOT
   DEPS
   NPROC
   WASM_CFLAGS
   WASM_CXXFLAGS
   fetch_extract
   em_cmake
   ```

2. Use consistent ABI flags:

   ```bash
   -O2 -pthread -msimd128 -fexceptions
   ```

3. Add dependency scripts one at a time. Start with:

   ```text
   build_zlib.sh
   build_fmt.sh
   build_imath.sh
   build_zstd.sh
   build_jpeg.sh
   build_png.sh
   build_tbb.sh
   build_pugixml.sh
   ```

4. Add `real-render/scripts/build-deps-minimal.sh` that calls only the above in dependency order.

5. Do not add OIIO/OpenEXR/OCIO until the first smaller set compiles.

Acceptance:

- shell syntax passes;
- every script has a clear `already built` or rebuild behavior;
- no stubs are used as success criteria.

## Phase 4: Configure Cycles Standalone

Goal: configure Blender for headless Cycles standalone.

Tasks:

1. Add `real-render/cmake/cycles-wasm-cache.cmake`.

2. Required cache settings:

   ```cmake
   set(WITH_BLENDER OFF CACHE BOOL "")
   set(WITH_CYCLES_STANDALONE ON CACHE BOOL "")
   set(WITH_CYCLES_STANDALONE_GUI OFF CACHE BOOL "")
   set(WITH_PYTHON OFF CACHE BOOL "")
   set(WITH_OPENGL_BACKEND OFF CACHE BOOL "")
   set(WITH_VULKAN_BACKEND OFF CACHE BOOL "")
   set(WITH_GHOST_SDL OFF CACHE BOOL "")
   set(WITH_GHOST_X11 OFF CACHE BOOL "")
   set(WITH_GHOST_WAYLAND OFF CACHE BOOL "")
   set(WITH_LIBS_PRECOMPILED OFF CACHE BOOL "")
   set(WITH_STRICT_BUILD_OPTIONS OFF CACHE BOOL "")
   set(WITH_TESTS OFF CACHE BOOL "")
   set(WITH_GTESTS OFF CACHE BOOL "")
   set(SUPPORTS_NEON_BUILD FALSE CACHE INTERNAL "")
   ```

3. Add `real-render/cmake/wasm_compat.h`.

   It must provide Emscripten-only typedefs/fenv constants needed by Blender sources.

4. Add `real-render/scripts/configure-cycles.sh`.

   Required behavior:

   - source config;
   - verify toolchain exists;
   - verify dependency sysroot exists;
   - run `emcmake cmake`;
   - use `-C real-render/cmake/cycles-wasm-cache.cmake`;
   - use `-pthread -fexceptions -include wasm_compat.h`.

Acceptance:

```bash
bash -n real-render/scripts/configure-cycles.sh
```

Heavy configure should run only in CI or an explicitly approved builder.

## Phase 5: Build Cycles Standalone

Goal: compile the standalone Cycles target.

Tasks:

1. Add `real-render/scripts/build-cycles.sh`.

2. Required behavior:

   - source config;
   - use `BUILD_JOBS`;
   - run:

     ```bash
     ninja -C real-render/build-cycles -j"${BUILD_JOBS}" cycles
     ```

   - tee output into `artifacts/logs/real-render-build-cycles.log`;
   - print size of `real-render/build-cycles/bin/cycles.js` and matching WASM if present.

3. If it fails, create a build note with the first compiler or linker error.

Acceptance:

- `cycles` target exists;
- object/library build completes;
- no fake artifact is created.

## Phase 6: Browser Relink

Goal: relink CMake's Cycles output for the browser.

Tasks:

1. Add `real-render/scripts/link-cycles-web.sh`.

2. Required behavior:

   - read CMake's exact link command:

     ```bash
     ninja -C real-render/build-cycles -t commands cycles
     ```

   - replace output with `real-render/web/real-render.js`;
   - append browser flags:

     ```text
     -pthread
     -sPROXY_TO_PTHREAD
     -sEXIT_RUNTIME=0
     -sALLOW_MEMORY_GROWTH=1
     -sINITIAL_MEMORY=536870912
     -sMAXIMUM_MEMORY=2147483648
     -sSTACK_SIZE=8388608
     -sDEFAULT_PTHREAD_STACK_SIZE=8388608
     -sPTHREAD_POOL_SIZE=navigator.hardwareConcurrency
     -sPTHREAD_POOL_SIZE_STRICT=0
     -sWASMFS
     -sFORCE_FILESYSTEM=1
     -sEXPORTED_RUNTIME_METHODS=FS,callMain,ccall,cwrap
     -sENVIRONMENT=web,worker
     -sASSERTIONS=2
     ```

3. Add one tiny scene under `real-render/web/scenes`.

4. Preload it:

   ```text
   --preload-file real-render/web/scenes@/scenes
   ```

Acceptance:

- `real-render/web/real-render.js` exists;
- `real-render/web/real-render.wasm` exists;
- artifact sizes are recorded.

## Phase 7: Runtime Integration

Goal: integrate the render artifact into the app without pretending it is full Blender.

Tasks:

1. Add `src/runtime/RealRenderRuntime.ts`.
2. Add `src/runtime/RealRenderRuntime.test.ts`.
3. Add a UI entry point named `Real Render Preview` or `Render Proof`.
4. Keep current `BlenderViewport` diagnostics unchanged unless adding a separate render panel.
5. The runtime must expose:

   ```ts
   load(): Promise<void>
   isLoaded(): boolean
   renderSampleScene(): Promise<RealRenderResult>
   dispose(): void
   ```

6. `RealRenderResult` must include:

   ```ts
   success: boolean
   imageUrl?: string
   imageBytes?: Uint8Array
   width?: number
   height?: number
   error?: string
   ```

Acceptance:

```bash
pnpm typecheck
pnpm test:run
pnpm build
```

## Phase 8: Browser Pixel Verification

Goal: prove real output is visible.

Tasks:

1. Add `tests/e2e/real-render.spec.ts`.
2. Test flow:

   - open app;
   - navigate to render proof;
   - wait for WASM load;
   - run sample render;
   - find rendered image/canvas;
   - verify non-empty dimensions;
   - verify pixels are not all one color;
   - verify page text does not claim full Blender UI.

3. The test must fail if output comes from a hardcoded PNG or TypeScript canvas placeholder.

Acceptance:

```bash
pnpm exec playwright test tests/e2e/real-render.spec.ts --project=chromium --workers=1
```

## Phase 9: Promote Artifact Policy

Goal: decide how real render artifacts are distributed.

Tasks:

1. If artifacts are under 10 MB total, consider committing them.
2. If artifacts are over 10 MB total, publish them as release artifacts.
3. Add `scripts/fetch-real-render-artifacts.mjs` for local app development.
4. Add `scripts/audit-real-render-artifacts.mjs`.
5. Update `public/wasm/blender/README.md` or create `public/wasm/real-render/README.md`.

Acceptance:

```bash
pnpm audit:real-render
pnpm build
```

