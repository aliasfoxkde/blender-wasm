# Build Note: Baseline Lock (Phase 0)

Date: 2026-08-08
Phase: 00-operating-rules / Phase 0
Commit: 8ced542 (MiniMax real render handoff pack)

## Command Log

```bash
git status --short --branch
# ## main...origin/main

pnpm typecheck
# PASS — no errors

pnpm lint
# PASS — 0 errors, 44 pre-existing warnings (no-console in runtime modules)

pnpm test:run
# PASS — 23 test files, 154 tests

pnpm build
# PASS — built in 1.99s, PWA generated

pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
# PASS — 6/6 tests passed
```

## Smoke Test Assertions Verified

- [x] `canvas count is zero` (line 102 of spec)
- [x] diagnostics include "Compiled Blender WASM baseline loaded" (line 94)
- [x] diagnostics include "Native Blender scene rendering is not in this build yet" (line 97)

## Viewport Inspection

`src/components/BlenderViewport.tsx` reviewed:
- No fake canvas, grid, cube, axes, or placeholder render
- Honest state machine: checking → artifact-missing / runtime-loading / bridge-validated / blenlib-loading / blenlib-validated / smoke-failed / ready
- Only displays native Blender baseline diagnostics
- No Three.js, WebGL, Canvas2D, or SVG "render" claims

## Pre-existing Lint Warnings

44 warnings, all `no-console` in runtime modules — not introduced by this phase.

## Conclusion

Baseline is honest and locked. No fake render found. Proceeding to Phase 1.
