# Phase 7: CI And Release Validation
Date: 2026-08-07
Agent: MiniMax-M2.7

## Commands Run

```bash
git diff .github/workflows/deploy.yml
```

## Result

CI workflow updated to include validation steps.

### Changes to `.github/workflows/deploy.yml`

**Test job now runs:**
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test:run` (unit tests)
- `pnpm audit:wasm` (WASM artifact validation)

**E2E tests** are noted as requiring Docker and run locally:
- `pnpm test:e2e`

### CI Validation Gate

CI now fails if:
- TypeScript type checking fails
- Lint errors occur
- Unit tests fail
- WASM artifact fails audit (missing, fake, or incomplete)

### Docker Build Validation

The Docker-based Blender WASM build is not in CI due to resource overhead. To validate:

```bash
# Run locally before pushing
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
```

Consider adding a separate Docker validation job on release branches if needed.

## Artifacts Changed

```
M .github/workflows/deploy.yml
```

## Next Recommended Step

Phase 8: Production UX Hardening - make app honest about WASM availability states.
