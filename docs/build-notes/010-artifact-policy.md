# Phase 6: Production Artifact Policy
Date: 2026-08-07
Agent: MiniMax-M2.7

## Commands Run

```bash
ls -la public/wasm/blender/
du -sh public/wasm/blender/blender.js public/wasm/blender/blender.wasm
```

## Result

Decision: **Option A (Committed Artifact)** for current minimal baseline.

### Current Policy

Current artifacts are small enough to commit:

```
public/wasm/blender/blender.js   176KB
public/wasm/blender/blender.wasm  275KB
Total: ~450KB
```

### Policy Rules

**Commit artifacts when:**
- Total WASM bundle < 5MB
- Artifact is the validated minimal baseline (clog + guardedalloc only)
- Changes include passing `pnpm audit:wasm`

**Switch to Option B (Release Asset) when:**
- Total WASM bundle > 5MB (full Blender would be 50-100MB+)
- Artifact requires makesdna-generated DNA files

### Implementation

Artifacts are tracked in git at:
```
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm
```

Before any commit that changes these files, run:
```bash
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
```

If audit fails, do not commit.

### Future Migration Path

If artifacts exceed 5MB, migrate to Option B:
1. Remove `public/wasm/blender/blender.*` from git tracking
2. Add a download script that fetches by version/checksum
3. Update CI to validate checksum after download

## Artifacts Changed

None - this is a policy documentation change.

## Next Recommended Step

Phase 7: CI And Release Validation - ensure the validation gate runs automatically.
