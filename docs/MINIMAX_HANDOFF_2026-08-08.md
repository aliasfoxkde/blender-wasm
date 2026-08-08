# MiniMax Handoff: Corrected WASM Baseline And Next Production Phases

Date: 2026-08-08
Owner: next low-cost agent pass

This is the current source of truth. Follow it exactly. Do not rely on older
claims that `makesdna` is fundamentally blocked, that a clear-only WebGL canvas
is acceptable, or that an artifact exists unless the command in this document
proves it.

## Current Verified State

The project has three distinct build outputs:

1. Public minimal browser runtime:

   ```text
   public/wasm/blender/blender.js
   public/wasm/blender/blender.wasm
   ```

   Scope: real Blender `bf_intern_clog` and `bf_intern_guardedalloc` only.

2. Build artifact copy of the same minimal runtime:

   ```text
   artifacts/blender-wasm/blender.js
   artifacts/blender-wasm/blender.wasm
   ```

3. Public experimental blenlib runtime:

   ```text
   public/wasm/blender/blender_blenlib.js
   public/wasm/blender/blender_blenlib.wasm
   ```

   Scope: real `bf_blenlib`, `bf_dna`, `bf_intern_clog`, and
   `bf_intern_guardedalloc`, exposed through the bridge API only.

Verified commands:

```bash
./scripts/build-blender-wasm.sh blenlib-module
pnpm audit:blenlib
pnpm audit:baselines
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

## Corrected Audit Findings

### The web app did not render because the viewport drew nothing

The prior claim that a grey/empty main body was expected was not acceptable.
`BlenderViewport.tsx` had a valid WebGL context and then only cleared the
canvas every frame. A visible baseline preview now renders a grid, axes, and a
rotating wire cube after the minimal Blender bridge validates.

This preview is not Blender scene rendering. It is a browser-side WebGL
baseline that proves the app is visually alive while the real Blender runtime
is still minimal.

### `makesdna` is not fundamentally blocked

The previous circular dependency diagnosis was wrong as a project blocker.
The build now creates native Linux host tools:

```text
/build/host-tools/bin/makesdna
/build/host-tools/bin/datatoc
```

The wasm build is then patched to use those native tools for generation while
cross-compiling target libraries to wasm32. This successfully builds:

```text
/build/build/lib/libbf_blenlib.a
/build/build/lib/libbf_dna.a
```

The current approach patches generated `build.ninja`; that is acceptable for
MVP validation but should eventually become CMake-level host-tool wiring.

### `-sLINKABLE=1` is not universally correct

The minimal runtime still uses `-sLINKABLE=1` because its audit intentionally
looks for preserved Blender symbols.

The experimental blenlib module must not use `-sLINKABLE=1`. With blenlib it
causes whole-archive behavior, pulls unused code, and introduces avoidable
undefined symbols from optional dependencies. The correct phase-2 policy is:
export bridge functions only and let wasm-ld eliminate unused archive members.

### The experimental blenlib module is promoted and loaded by the browser

`BlenderBlenlibRuntime.ts` loads from:

```text
/wasm/blender/blender_blenlib.js
```

Those files are now in `public/wasm/blender`. The viewport loads the minimal
bridge first, then loads the promoted blenlib module and displays diagnostics
backed by real WASM calls. This is still not native Blender scene rendering.

## Non-Negotiable Rules

- Do not create stubs and call them Blender features.
- Do not claim full Blender rendering until real Blender scene data flows into
  a browser-visible render path.
- Do not claim `.blend` loading until file IO, compression policy, DNA/RNA data,
  and a browser smoke test are all present.
- Do not claim a phase complete without pasting the exact command output into a
  build note.
- Do not edit generated files in `/build/build` as the durable fix. Temporary
  generated-file patching is allowed only inside scripts and must be documented.
- Keep public artifacts and experimental artifacts separate until a promotion
  phase explicitly merges them.

## Phase 1: Keep The Promoted Blenlib Runtime Gated

Goal: keep the promoted experimental blenlib module usable without overstating
what it provides.

Tasks:

1. Keep `./scripts/build-blender-wasm.sh blenlib-module` promoting
   `blender_blenlib.*` to `public/wasm/blender/`.
2. Keep `pnpm build` output expectations so `dist/wasm/blender`
   contains `blender_blenlib.js` and `blender_blenlib.wasm`.
3. Maintain a browser smoke test that loads `BlenderBlenlibRuntime`, runs
   `runSmokeTest()`, calls `hashStringMm2a("Blender")`, and asserts a stable
   numeric result.
4. Keep the artifact audit failing if the public blenlib JS exists without the
   matching WASM or vice versa.

Acceptance commands:

```bash
./scripts/build-blender-wasm.sh blenlib-module
pnpm audit:blenlib
pnpm audit:baselines
pnpm typecheck
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

Stop condition: if the browser cannot load `blender_blenlib.js`, record the
network error and fix artifact location before changing runtime code.

## Phase 2: Add One Real User-Facing Blenlib Feature

Goal: prove the browser can call a real `bf_blenlib` function through a public
feature.

Recommended feature: a small diagnostics panel or dev-only command that shows:

```text
blenlib smoke: pass
hash("Blender"): <stable uint32>
UTF-8 length("Blender WASM"): 12
```

Rules:

1. The feature must call the WASM module, not a TypeScript mock.
2. The hash value must come from `bw_hash_string_mm2a`.
3. The UI copy must say this is an experimental blenlib diagnostic, not full
   Blender editing.
4. Add unit tests for the TypeScript wrapper and e2e tests for browser loading.

Acceptance commands:

```bash
pnpm typecheck
pnpm test:run
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

## Phase 3: Replace The Host-Tool Ninja Patch With CMake-Level Wiring

Goal: remove fragile text patching from generated `build.ninja`.

Tasks:

1. Identify where Blender CMake declares `makesdna`, `datatoc`, and generated
   DNA outputs.
2. Add a controlled overlay or patch that supports host-tool paths during
   Emscripten cross-compilation.
3. Preserve the current `dna_verify.c` wasm policy explicitly. Native
   `makesdna` emits host-ABI verifier assertions, so the wasm target cannot use
   those assertions unchanged.
4. Keep `./scripts/build-blender-wasm.sh blenlib` and `blenlib-module` working
   after the change.

Acceptance commands:

```bash
./scripts/build-blender-wasm.sh clean
./scripts/build-blender-wasm.sh blenlib-module
pnpm audit:blenlib
```

Stop condition: if the clean build fails before `libbf_blenlib.a`, revert only
your CMake wiring change and document the exact failed command.

## Phase 4: Define Compression And File IO Policy Before `.blend` Loading

Goal: avoid false `.blend` support claims.

Current state:

- zlib is enabled through Emscripten.
- zstd is shimmed for compilation and fails closed.
- Browser file IO is not equivalent to Blender desktop file IO.

Tasks:

1. Create a matrix of `.blend` loading dependencies: zlib, zstd, path/file APIs,
   DNA, BKE libraries, memory limits, and browser file source.
2. Decide whether MVP supports only uncompressed/simple `.blend` files or waits
   for real zstd.
3. Make unsupported compression fail with a clear browser-visible error.
4. Do not add fake import/export plugins as a substitute.

Acceptance: a documented policy and tests for unsupported zstd paths. No UI
claiming general `.blend` support yet.

## Phase 5: Plan The First Real Geometry Milestone

Goal: move beyond utility libraries without jumping straight to full Eevee or
Cycles.

Recommended target: generate or inspect a simple mesh-like data path backed by
real Blender libraries, then render a browser preview with WebGL.

Tasks:

1. Identify the smallest additional Blender library set needed after `bf_blenlib`
   and `bf_dna`.
2. Build one library at a time and record every new dependency.
3. Expose a bridge function that returns deterministic geometry or metadata.
4. Render that geometry in the browser preview.
5. Keep the WebGL preview separate from claims about Blender's native renderer.

Acceptance: a browser e2e test verifies both the bridge result and nonblank
canvas rendering from returned data.

## Phase 6: CI And Release Gates

Goal: prevent another false-complete handoff.

Required gates:

```bash
pnpm audit:wasm
pnpm audit:baselines
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

Docker-heavy gates can be manual until CI capacity is decided:

```bash
./scripts/build-blender-wasm.sh blenlib-module
pnpm audit:blenlib
```

Every phase must end with a build note under `docs/build-notes/` containing:

- exact command run
- pass/fail result
- artifact paths and sizes
- first unresolved error, if any
- what was intentionally not claimed

## Immediate Next Step

Start with Phase 1. Do not touch mesh, renderer, file loading, or plugin claims
until the promoted blenlib browser diagnostics stay green.
