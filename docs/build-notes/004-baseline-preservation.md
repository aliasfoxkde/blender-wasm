# Phase 0: Baseline Preservation
Date: 2026-08-07
Agent: MiniMax-M2.7

## Commands Run

```bash
git status --short
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
```

## Result

PASS - All validation commands succeeded.

### git status --short
```
 M dev-dist/sw.js
 M playwright-report/index.html
?? .codebase-memory/
```
Uncommitted files are generated churn only (sw.js, playwright-report), not baseline changes.

### ./scripts/build-blender-wasm.sh minimal
```
ninja: no work to do.
Minimal build complete!
total 452K
-rw-r--r-- 1 www-data 176K Aug  7 18:41 blender.js
-rwxr-xr-x 1 www-data 275K Aug  7 18:41 blender.wasm
```
Exit code: 0

### pnpm audit:wasm
```
Artifact JS size:   179892 bytes
Artifact WASM size: 281257 bytes
WARN: .../artifacts/blender-wasm/blender.wasm is below 1 MiB. Treating it as the minimal clog/guardedalloc baseline, not full Blender.
Public JS size:   179892 bytes
Public WASM size: 281257 bytes
WARN: .../public/wasm/blender/blender.wasm is below 1 MiB. Treating it as the minimal clog/guardedalloc baseline, not full Blender.
PASS: Blender WASM artifact passes minimal baseline checks.
```
Exit code: 0

### pnpm test:run
```
Test Files  22 passed (22)
     Tests  143 passed (143)
```
Exit code: 0

### pnpm test:e2e
```
19 passed (13.3s)
```
Exit code: 0

Note: Vite development-server warning about `/wasm/blender/blender.js` import still appears. This is the known loader path issue to be addressed in Phase 1.

## Artifacts Changed

```
public/wasm/blender/blender.js   (179892 bytes, unchanged)
public/wasm/blender/blender.wasm (281257 bytes, unchanged)
```

No source files were modified by this phase.

## Tests Run

- pnpm audit:wasm - PASS
- pnpm test:run - 143 tests PASS
- pnpm test:e2e - 19 tests PASS

## Exact Failure, If Any

None. Baseline is green.

## Next Recommended Step

Phase 1: Clean Up The Loader Path - fix the Vite development-server warning caused by attempting to dynamic-import `/public` assets.

The smoke test checks for `data-testid="blender-smoke-status"` element containing "Real Blender code executed" after clicking "New Project" and waiting 5 seconds.
