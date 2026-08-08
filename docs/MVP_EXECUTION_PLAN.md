# Blender WASM MVP Execution Plan

This plan is written for a low-cost coding agent that needs explicit, mechanical steps. Do not skip phases. Do not add new product features until the acceptance criteria for the current phase pass.

## Audit Summary

Current state:

- The SolidJS/Vite web shell builds with `pnpm build`.
- The unit test suite passes with `pnpm test:run`.
- `pnpm typecheck` fails with TypeScript errors across app state, auth, automation, WebGPU typings, plugin exports, storage exports, and WASM loader types.
- `pnpm lint` fails with unused variables, explicit `any`, unsafe function types, and console warnings/errors.
- `public/wasm/` contains placeholder/test modules only. There is no real Blender WASM artifact matching the runtime registry paths.
- The runtime assumes many modular Blender artifacts such as `/wasm/blender_core.wasm`, `/wasm/blender_mesh.wasm`, and `/wasm/blender_eevee.wasm`, but the Docker build plan is for a normal single Blender output.
- The browser viewport clears a WebGL/WebGPU canvas but does not render Blender UI, scenes, mesh data, or an Emscripten-generated app.
- Build documentation currently overstates MVP status. The web platform scaffold exists, but the Blender-in-browser MVP is not complete.

Primary blockers:

1. The repo has no trustworthy definition of MVP.
2. The web app is not wired to actual Emscripten-generated Blender JS/WASM output.
3. The Docker build scripts are inconsistent and likely to fail before producing a usable Blender artifact.
4. The runtime loader is hand-rolling Emscripten/WASI behavior incorrectly.
5. Quality gates are not reliable because `vite build` passes while `typecheck` and `lint` fail.

## MVP Definition

The MVP is not the full Blender desktop application in the browser.

The MVP is:

1. A reproducible Docker command builds a minimal Blender-derived WebAssembly artifact.
2. The artifact is copied into `public/wasm/blender/`.
3. The web app loads that artifact through the Emscripten-generated JavaScript loader or a thin wrapper around it.
4. A browser user can open the app, click "Start Blender", and see a deterministic proof that Blender code ran.
5. The proof can be one of these, in order of preference:
   - A headless Blender command generates or exports a simple cube scene and returns metadata to the UI.
   - A minimal Blender viewport renders a cube into the canvas.
   - A Blender version/build-info function compiled from Blender source returns data displayed in the UI.
6. The repo passes:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test:run`
   - `pnpm build`
7. A fresh clone can reproduce the build using documented commands.

Non-MVP:

- Python scripting.
- Cycles.
- EEVEE Next.
- Geometry Nodes.
- Plugin marketplace.
- Collaboration.
- Cloud auth.
- AI scene editing.
- Modular Blender subsystem downloads.
- Full `.blend` editing.
- Production performance tuning.

## Operating Rules For The Coding Agent

- Make one phase pass before starting the next phase.
- Commit or checkpoint after every passing phase if git commits are part of the workflow.
- Prefer deleting unsupported claims over stubbing deeper fake features.
- Never claim "MVP complete" until the MVP definition above passes.
- When a build fails, save the exact command, full error log path, and the first root-cause error in `docs/build-notes/`.
- Do not invent module names. The runtime must match files that actually exist.
- Do not write custom WASI/Emscripten shims unless the generated Emscripten loader cannot be used.

## Phase 0 - Stabilize The Repo Baseline

Goal: make the current web scaffold honest and mechanically checkable before touching Blender.

Steps:

1. Create `docs/build-notes/`.
2. Create `docs/build-notes/000-baseline.md` with:
   - Current date.
   - Current git status.
   - Results of `pnpm typecheck`, `pnpm lint`, `pnpm test:run`, and `pnpm build`.
   - A short note that the repo currently contains placeholder WASM only.
3. Update status language in `README.md` and `docs/MVP_SUMMARY.md`:
   - Replace "MVP Complete" with "Web shell scaffold complete; Blender WASM integration pending".
   - Keep feature lists only if they are marked as scaffold/stub where appropriate.
4. Add a top-level command script in `package.json`:
   - `"verify": "pnpm typecheck && pnpm lint && pnpm test:run && pnpm build"`
5. Fix `pnpm typecheck`.
   - Add WebGPU ambient types or a local `src/types/webgpu.d.ts`.
   - Fix mismatched app/project types.
   - Fix auth provider type mismatch.
   - Fix automation route response types.
   - Fix plugin exports.
   - Fix `WASMLoader` storage of memory versus exports.
   - Fix OPFS and Blob type issues.
6. Fix `pnpm lint`.
   - Remove unused imports/vars.
   - Prefix intentionally unused parameters with `_` only if ESLint is configured to allow it. If not, update ESLint config intentionally.
   - Replace `Function` and `any` types with explicit types.
   - Decide whether `console` is allowed in this experimental app. If allowed, configure ESLint. If not, replace with a logger.
7. Run `pnpm verify`.

Acceptance criteria:

- `pnpm verify` exits 0.
- Documentation no longer says the Blender MVP is complete.
- `docs/build-notes/000-baseline.md` exists.

## Phase 1 - Remove The False Modular Blender Assumption

Goal: make the browser runtime load the artifact the build can realistically produce.

Problem to fix:

- `src/runtime/ModuleRegistry.ts` registers many files that do not exist: `/wasm/blender_core.wasm`, `/wasm/blender_mesh.wasm`, `/wasm/blender_eevee.wasm`, etc.
- The Docker build is not producing those modules.
- Splitting Blender into modules is a future architecture task, not MVP.

Steps:

1. Replace the default module registry with one MVP runtime target:
   - `id: "blender"`
   - `name: "Blender WASM"`
   - `url: "/wasm/blender/blender.js"` if using Emscripten JS loader.
   - `wasmUrl: "/wasm/blender/blender.wasm"` if needed by the wrapper.
2. Move future module declarations to documentation or a disabled manifest file, not active runtime code.
3. Replace `moduleManager.load("core")` in `BlenderViewport.tsx` with `moduleManager.load("blender")`.
4. Remove automatic `eevee` loading from the MVP viewport.
5. Change the loading screen text from "Loading mesh system" and "Loading renderer" to exact MVP states:
   - "Loading Blender runtime"
   - "Initializing Blender bridge"
   - "Running smoke test"
6. Add a missing-artifact UI state:
   - If `/wasm/blender/blender.js` or `.wasm` is missing, show a clear message: "Blender WASM artifact not installed. Run ./scripts/build-blender-wasm.sh build."
7. Update tests to match a single Blender runtime module.
8. Run `pnpm verify`.

Acceptance criteria:

- Runtime no longer references non-existent Blender subsystem modules.
- Starting Blender fails clearly if the artifact is absent.
- `pnpm verify` exits 0.

## Phase 2 - Use The Emscripten Loader Instead Of Hand-Rolled WASI

Goal: load real Emscripten output correctly.

Problem to fix:

- `WASMLoader.ts` manually creates imports for `env` and `wasi_snapshot_preview1`.
- Real Emscripten outputs usually require the generated JS loader, filesystem setup, memory options, pthread handling, and locate-file behavior.
- The current `malloc` stub returns the end of memory and is not usable.
- The loader stores both memory and exports in the same `Map<string, WebAssembly.Memory>`, which is logically wrong.

Steps:

1. Create `src/runtime/EmscriptenBlenderRuntime.ts`.
2. Define a narrow interface:
   - `load(options): Promise<BlenderRuntimeInstance>`
   - `runSmokeTest(): Promise<SmokeTestResult>`
   - `getBuildInfo(): Promise<BuildInfo>`
   - `dispose(): Promise<void>`
3. Load `/wasm/blender/blender.js` as an ESM-compatible script if possible. If generated output is not ESM, load it via a controlled script tag wrapper.
4. Configure Emscripten module options:
   - `locateFile` returns `/wasm/blender/<filename>`.
   - `print` and `printErr` forward to app logging.
   - `canvas` uses the viewport canvas only if the build creates a graphical target.
   - `noInitialRun: true` if the build supports it.
5. Delete or reduce fake WASI imports. Keep direct `WebAssembly.instantiate` only for tiny test modules, not Blender.
6. Separate runtime state:
   - JS module object.
   - WASM memory if exposed.
   - smoke-test result.
   - load error.
7. Add tests for:
   - missing artifact gives actionable error.
   - loader calls `locateFile`.
   - smoke test result is surfaced.
8. Run `pnpm verify`.

Acceptance criteria:

- No fake `malloc`, fake `fd_write`, or fake atomics are used for Blender.
- The app is ready to consume actual Emscripten output.
- `pnpm verify` exits 0.

## Phase 3 - Make The Docker Build Reproducible At The CMake Configure Level

Goal: one command reaches a clean CMake configure step every time.

Known issues:

- `scripts/build-blender-wasm.sh` uses `-DWITH_OPENSIMAGEIO=ON`, which is misspelled. The Docker `build.sh` uses `-DWITH_OPENIMAGEIO=ON`.
- The wrapper script duplicates configuration instead of calling `docker/blender-wasm-build/build.sh`.
- Stub libraries are being used to pass CMake checks but may hide link failures.

Steps:

1. Make `scripts/build-blender-wasm.sh build` call `/build/build.sh` inside the container instead of duplicating CMake flags.
2. Ensure the Docker image copies `build.sh` into a stable path such as `/build-tools/build.sh` or runs the mounted repo script explicitly.
3. Fix all CMake option spelling:
   - Use `WITH_OPENIMAGEIO`, not `WITH_OPENSIMAGEIO`.
4. Add build modes:
   - `configure`: run CMake only.
   - `build`: run configure plus Ninja target.
   - `shell`: open container shell.
   - `clean`: remove Docker volume.
5. Add log capture:
   - Write configure output to `artifacts/logs/configure.log`.
   - Write build output to `artifacts/logs/build.log`.
6. Add an artifact output directory mounted from the host:
   - `artifacts/blender-wasm/`
7. Run:
   - `./scripts/build-blender-wasm.sh clean`
   - `./scripts/build-blender-wasm.sh configure`
8. Fix CMake configure errors one at a time. Do not start Ninja until configure is clean.
9. Record every fix in `docs/build-notes/001-configure.md`.

Acceptance criteria:

- `./scripts/build-blender-wasm.sh configure` exits 0 on a clean Docker volume.
- `artifacts/logs/configure.log` exists.
- The configure command is not duplicated across scripts.

## Phase 4 - Build The Smallest Blender-Derived WASM Target

Goal: compile something real from Blender source before attempting full UI.

Preferred target:

- A small executable or library target linked against enough Blender source to report Blender version/build info or create a simple scene data structure.

Steps:

1. Inspect Blender CMake targets inside the container after configure:
   - `ninja -t targets all > /blender-wasm/artifacts/logs/ninja-targets.txt`
2. Identify the smallest viable target. Prefer targets that avoid GHOST/windowing and GPU backends.
3. If Blender has no suitable small target, add a minimal custom target outside upstream source:
   - Create `docker/blender-wasm-build/mvp-smoke/`.
   - Add a tiny C/C++ entrypoint that includes Blender version headers or links a narrow Blender library.
   - Export functions:
     - `bw_get_version_json()`
     - `bw_run_smoke_test()`
4. Compile this target with Emscripten.
5. Use conservative Emscripten flags first:
   - `-sENVIRONMENT=web`
   - `-sMODULARIZE=1`
   - `-sEXPORT_NAME=CreateBlenderWasmModule`
   - `-sEXPORTED_FUNCTIONS=_bw_get_version_json,_bw_run_smoke_test,_malloc,_free`
   - `-sEXPORTED_RUNTIME_METHODS=ccall,cwrap,UTF8ToString`
   - `-sALLOW_MEMORY_GROWTH=1`
   - Do not enable pthreads yet.
   - Do not enable Memory64 yet.
6. Output files:
   - `artifacts/blender-wasm/blender.js`
   - `artifacts/blender-wasm/blender.wasm`
7. Copy artifacts into:
   - `public/wasm/blender/blender.js`
   - `public/wasm/blender/blender.wasm`
8. Run `pnpm verify`.
9. Start the app and manually verify the smoke test displays in the UI.

Acceptance criteria:

- A real artifact compiled from Blender source exists.
- The browser loads it.
- The UI displays Blender-derived build info or smoke-test data.
- No placeholder WASM is required for the MVP path.

## Phase 5 - Browser Smoke Test And Playwright Coverage

Goal: prove the MVP works in an automated browser.

Steps:

1. Add a visible runtime status panel to the Blender viewport:
   - Artifact present/missing.
   - Runtime loaded/loading/failed.
   - Blender version/build info.
   - Smoke-test result.
2. Add a Playwright test:
   - Open `/`.
   - Move from splash/dashboard to Blender.
   - Wait for runtime status.
   - Assert that smoke test passed.
3. Add a negative Playwright test for missing artifact if practical:
   - Temporarily serve without `/wasm/blender/blender.js`.
   - Assert actionable missing-artifact text.
4. Add script:
   - `"test:e2e": "playwright test"`
5. Update `verify` only after e2e is stable locally. If browser dependencies are heavy, use `"verify:e2e"` separately.
6. Run:
   - `pnpm test:e2e`
   - `pnpm verify`

Acceptance criteria:

- A browser test proves the runtime loads.
- The smoke-test result is visible in the UI.
- Failures are actionable.

## Phase 6 - Replace Placeholder WASM And Clean Public Assets

Goal: remove ambiguity about what is real.

Steps:

1. Delete unused placeholder files from `public/wasm/` only after the MVP artifact path works:
   - `core.wasm`
   - `test.wasm`
   - `blender_test.wasm`
   - `blender_test_64.wasm`
2. Move any sample/test WASM to `tests/fixtures/wasm/` if needed by tests.
3. Add `.gitignore` rules for large generated artifacts if they should not be committed.
4. Decide whether `public/wasm/blender/blender.wasm` is committed:
   - If small smoke-test artifact: commit it.
   - If large real Blender artifact: store as release artifact and document install step.
5. Update service worker caching to include the actual artifact path and avoid stale runtime during development.
6. Run `pnpm verify`.

Acceptance criteria:

- `public/wasm/` has no misleading placeholder artifacts.
- Tests use fixtures, not production placeholder names.
- Artifact policy is documented.

## Phase 7 - Decide The Next Technical Branch

Goal: choose one realistic post-MVP path.

Options:

1. Headless Blender operations:
   - Best next step if compile friction remains high.
   - Expose scene creation, import/export, mesh stats, file conversion.
2. Minimal graphical viewport:
   - Best if GHOST/EGL/WebGL paths become viable.
   - Render one cube, then orbit camera.
3. Full Blender UI port:
   - Highest risk.
   - Do not start until headless smoke and minimal viewport are both stable.

Decision criteria:

- If full Blender link fails due to platform/windowing APIs, choose headless operations.
- If rendering APIs are the blocker, choose headless operations plus web-native preview rendering.
- If binary size exceeds practical browser limits, keep Blender operations modular at the application level, not by pretending Blender already builds as subsystem WASM files.

Acceptance criteria:

- `docs/NEXT_TECHNICAL_BRANCH.md` exists and selects exactly one path.
- The decision references real build logs.

## Build Failure Triage Procedure

When a Blender build fails:

1. Stop changing code.
2. Save the log:
   - `artifacts/logs/YYYYMMDD-HHMM-build.log`
3. Find the first real compiler/linker/CMake error.
4. Classify it:
   - Missing header.
   - Missing library.
   - Host library accidentally used.
   - Unsupported platform API.
   - Unsupported compiler flag.
   - Link symbol missing.
   - Runtime loader issue.
5. Fix only that class of error.
6. Add a note to `docs/build-notes/`.
7. Re-run from a clean enough state to prove the fix.

Do not respond to one missing dependency by adding broad fake stubs. Stubs are acceptable only when the MVP path never calls the stubbed functionality.

## Recommended Immediate Task List

Give the coding agent these tasks in this exact order:

1. "Run `pnpm typecheck`, `pnpm lint`, `pnpm test:run`, and `pnpm build`; save results in `docs/build-notes/000-baseline.md`."
2. "Fix TypeScript errors until `pnpm typecheck` passes. Do not change behavior unless required."
3. "Fix lint errors until `pnpm lint` passes. Prefer removing dead code over disabling rules."
4. "Change docs that say MVP is complete to say Blender WASM integration is pending."
5. "Replace the fake modular runtime registry with one `blender` runtime artifact."
6. "Replace direct Blender WASM instantiation with an Emscripten loader wrapper."
7. "Unify Docker build scripts and make `./scripts/build-blender-wasm.sh configure` pass."
8. "Build the smallest Blender-derived smoke-test WASM artifact."
9. "Load that artifact in the browser and show its smoke-test result."
10. "Add Playwright coverage for the browser smoke test."

## Verification Commands

Use these repeatedly:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm verify
./scripts/build-blender-wasm.sh configure
./scripts/build-blender-wasm.sh build
```

## Current Audit Evidence

- `package.json` defines the quality scripts, but no aggregate `verify` script yet.
- `scripts/build-blender-wasm.sh` duplicates CMake flags and contains the misspelled `WITH_OPENSIMAGEIO` option.
- `docker/blender-wasm-build/build.sh` has the corrected `WITH_OPENIMAGEIO` spelling and CMake stub path.
- `src/runtime/ModuleRegistry.ts` registers future module files that are not present in `public/wasm/`.
- `src/runtime/WASMLoader.ts` uses fake imports and stores exports in a memory map.
- `src/components/BlenderViewport.tsx` loads `core` and optionally `eevee`, then only clears a canvas.
- `public/wasm/` currently contains placeholder/test WASM files only.

