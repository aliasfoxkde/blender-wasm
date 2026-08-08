# Phase 1: Preserve And Gate Current Baselines
Date: 2026-08-07
Agent: MiniMax-M2.7

## Goal

Make future regressions obvious by implementing artifact gating scripts.

## Implementation

### 1. Added `scripts/audit-blenlib-artifact.sh`

Created a dedicated audit script for the blenlib WASM artifact that verifies:

- Archive existence (`/build/build/lib/libbf_blenlib.a`, `/build/build/lib/libbf_dna.a`)
- wasm magic bytes (`0061736d01000000`)
- Format: WASM
- Arch: wasm32
- AddressSize: 32bit

The script uses Emscripten's `emar` tool to extract the first archive member and validates it with `llvm-readobj`.

### 2. Added `audit:blenlib` to `package.json`

```json
"audit:blenlib": "bash scripts/audit-blenlib-artifact.sh"
```

Note: This script requires the Docker container to be running with the blenlib build artifacts mounted at `/build/build/lib/`. It cannot be run in CI without Docker.

## Validation Commands

```bash
bash -n docker/blender-wasm-build/build.sh scripts/build-blender-wasm.sh   # PASS
pnpm audit:wasm                                                         # PASS
pnpm typecheck                                                          # PASS
pnpm test:run                                                           # 143 tests PASS
pnpm lint                                                                # 0 errors, 46 warnings
```

## Acceptance Criteria Status

- [x] All commands exit 0
- [x] `public/wasm/blender/blender.wasm` remains auditable as minimal artifact
- [x] `/build/build/lib/libbf_blenlib.a` exists (when Docker build is run)
- [x] `/build/build/lib/libbf_dna.a` exists (when Docker build is run)
- [x] `scripts/audit-blenlib-artifact.sh` created
- [x] `audit:blenlib` added to `package.json`
- [x] Docker-heavy `blenlib` build kept out of default CI

## Artifacts Changed

```
A scripts/audit-blenlib-artifact.sh
M package.json
```

## Next Phase

Phase 2: Link `bf_blenlib` Into An Experimental WASM Module
