# MiniMax Real Blender WASM Handoff Pack

Date: 2026-08-08
Audience: MiniMax-M2.7 or another low-cost implementation agent
Owner intent: get from the current honest baseline to a real browser-visible Blender-family render MVP without fake viewport work.

## Read Order

Read every file in this folder before editing code.

1. [`00-operating-rules.md`](00-operating-rules.md)
2. [`01-optimized-architecture.md`](01-optimized-architecture.md)
3. [`02-phase-plan-real-render-mvp.md`](02-phase-plan-real-render-mvp.md)
4. [`03-browser-runtime-and-ui.md`](03-browser-runtime-and-ui.md)
5. [`04-ci-artifacts-and-release.md`](04-ci-artifacts-and-release.md)
6. [`05-full-blender-later.md`](05-full-blender-later.md)

## Current Repository State

The app currently loads real compiled Blender-derived WASM, but it does not render a native Blender scene.

Existing public WASM artifacts:

```text
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm
public/wasm/blender/blender_blenlib.js
public/wasm/blender/blender_blenlib.wasm
```

Current real scope:

- `blender.*`: real Blender `clog` and `guardedalloc`.
- `blender_blenlib.*`: real `bf_blenlib`, `bf_dna`, `clog`, and `guardedalloc`.

Current non-scope:

- No native Blender viewport.
- No Cycles image render in browser.
- No full `.blend` loading.
- No Blender editor UI.
- No WebGPU Blender backend.

## North Star

The next honest MVP is:

```text
The browser loads a real WASM render module, runs a real Blender-family render operation, and displays verified non-placeholder output pixels.
```

The most efficient target is headless Cycles CPU rendering in the browser. Do not attempt full interactive Blender first.

## Local Safety

Do not run unconstrained Docker. Do not run a full Blender build locally unless the user explicitly asks and resource limits are set.

Use this pattern for any local Docker invocation:

```bash
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g ./scripts/build-blender-wasm.sh <mode>
```

Normal frontend validation must never start Docker:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

