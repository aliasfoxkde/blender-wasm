# Phase 6: Public Artifact Promotion
Date: 2026-08-07
Agent: MiniMax-M2.7

## Goal

Document promotion criteria and workflow for experimental blenlib module.

## Current State

Only the **minimal baseline** is deployed to `public/wasm/blender/`:
- Size: 275KB
- Libraries: clog, guardedalloc
- Status: Baseline (production-ready)

The **experimental blenlib module** is at `artifacts/blender-wasm/blender_blenlib.wasm` but requires Docker build.

## Promotion Criteria

Before promoting experimental blenlib to public:

1. **Node smoke test passes**
   ```bash
   docker compose run --rm blender-wasm-build bash -lc '
     cd /build/build
     node -e "
       const m = require(\"./blender_blenlib.js\");
       m().then(mod => {
         console.log(mod.UTF8ToString(mod._bw_blenlib_capabilities_json()));
         console.log(\"smoke_test:\", mod._bw_blenlib_smoke_test());
       });
     "
   '
   ```

2. **Browser smoke test passes**
   - Manual testing in browser required
   - Or Playwright E2E test

3. **Existing minimal API still works**
   ```bash
   pnpm audit:wasm  # Must pass
   pnpm test:run    # Must pass
   ```

4. **Artifact audit can distinguish baselines**
   ```bash
   pnpm audit:baselines
   # Shows: MINIMAL vs BLENLIB baselines
   ```

## Promotion Workflow

1. **Build experimental module**:
   ```bash
   ./scripts/build-blender-wasm.sh blenlib-module
   ```

2. **Run smoke tests**:
   ```bash
   pnpm audit:wasm   # Verify minimal still works
   pnpm audit:baselines  # Verify blenlib is detected
   ```

3. **Promote to public**:
   ```bash
   cp artifacts/blender-wasm/blender_blenlib.js public/wasm/blender/
   cp artifacts/blender-wasm/blender_blenlib.wasm public/wasm/blender/
   ```

4. **Commit and push**:
   ```bash
   git add public/wasm/blender/blender_blenlib.*
   git commit -m "feat: promote experimental blenlib module to public"
   ```

## Artifact Audit Tool

Added `scripts/audit-distinguish-baselines.sh` and `pnpm audit:baselines`:

```bash
pnpm audit:baselines
# Output:
# Baseline: MINIMAL
# Version:    4.2.0-wasm
# Size:       281257 bytes
# Libraries:  clog, guardedalloc
# Status:     Baseline
```

## Current Baselines

| Baseline | Location | Size | Libraries | Status |
|----------|----------|------|-----------|--------|
| minimal | public/wasm/blender/ | 275KB | clog, guardedalloc | Production |
| blenlib | artifacts/blender-wasm/ | TBD | +blenlib, DNA | Experimental |

## Artifacts Changed

```
A scripts/audit-distinguish-baselines.sh
M package.json
```

## Acceptance Criteria

- [x] Promotion criteria documented
- [x] Audit tool distinguishes baselines
- [ ] Node smoke test (requires Docker)
- [ ] Browser smoke test (requires manual/E2E)
- [ ] Experimental blenlib promoted to public

## Note

Promotion requires Docker build. The current environment does not have Docker access to run the full blenlib-module build.
