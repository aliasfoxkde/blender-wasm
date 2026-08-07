# MiniMax-M2.7 Production Handoff
**Date**: 2026-08-07
**Audience**: MiniMax-M2.7, local Qwen, or any low-cost coding agent
**Repository**: `/nas/Temp/repos/blender-wasm`

## Read This First

This document has been superseded for post-`bf_blenlib` work. Continue from
`docs/MINIMAX_NEXT_HANDOFF_2026-08-07.md` and
`docs/build-notes/014-host-tools-blenlib-success.md`.

Older docs may describe the pre-artifact state where no public Blender WASM
artifact existed. That is no longer current.

Current validated baseline:

```text
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm
```

These are real Blender-derived Emscripten artifacts built by:

```bash
./scripts/build-blender-wasm.sh minimal
```

They are not full Blender. They are a minimal bridge linked against real Blender
`clog` and `guardedalloc` libraries.

## Non-Negotiable Rules

Do not fake progress.

Forbidden:

- Do not create fake `blender.js` or `blender.wasm`.
- Do not rename toy/sample WASM files to Blender artifact names.
- Do not hand-write fake generated Blender files such as `dna.c`.
- Do not claim "full Blender" or "production ready" because the app loads.
- Do not weaken tests so they pass without exercising the WASM bridge.
- Do not remove `pnpm audit:wasm` from validation.
- Do not commit generated report churn such as `playwright-report/index.html`
  unless explicitly asked.

Required:

- Every build claim must include the exact command and exit status.
- Every artifact claim must name the artifact path and size.
- Every blocker must include the first root-cause error, not a later cascade.
- Every committed step must keep `pnpm audit:wasm` passing.
- If a build changes `public/wasm/blender/*`, run the full validation gate.

## Current Known Good Commands

Run these before starting new work:

```bash
git status --short
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
pnpm verify
```

Known good results from the last Codex validation:

```text
./scripts/build-blender-wasm.sh minimal  PASS
pnpm audit:wasm                          PASS
pnpm test:run                            PASS, 143 tests
pnpm test:e2e                            PASS, 19 tests
pnpm verify                              PASS
```

`pnpm test:e2e` may log a Vite development-server warning that
`/wasm/blender/blender.js` cannot be imported from `public`. The runtime falls
back to script-tag loading. This is a cleanup item, not a baseline failure, as
long as the smoke test still displays:

```text
Real Blender code executed
```

## Current Artifact Facts

Expected files:

```text
artifacts/blender-wasm/blender.js
artifacts/blender-wasm/blender.wasm
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm
```

Observed public sizes:

```text
public/wasm/blender/blender.js   179892 bytes
public/wasm/blender/blender.wasm 281257 bytes
```

The WASM artifact must contain:

```text
bw_get_version_json
bw_run_smoke_test
CLG_init
CLG_exit
CLG_level_set
CLG_log_str
CLG_logf
MEM_mallocN
MEM_freeN
```

The bridge smoke path calls:

```c
CLG_init();
CLG_level_set(0);
CLG_exit();
```

This proves real Blender logging code executes. It does not prove scene, mesh,
blend-file, render, operator, Python, UI, or full DNA/RNA functionality.

## Important Files

Build scripts:

```text
scripts/build-blender-wasm.sh
docker/blender-wasm-build/build.sh
scripts/audit-blender-artifact.sh
```

Runtime integration:

```text
src/runtime/EmscriptenBlenderRuntime.ts
src/components/BlenderViewport.tsx
tests/e2e/blender-smoke.spec.ts
```

Planning and evidence:

```text
docs/build-notes/001-source-wasm-validation.md
docs/build-notes/002-minimal-wasm-baseline.md
docs/build-notes/003-next-mvp-implementation-plan.md
docs/MINIMAX_PRODUCTION_HANDOFF.md
```

Generated local evidence:

```text
artifacts/logs/minimal.log
artifacts/logs/validate-source.log
artifacts/logs/configure.log
```

`artifacts/` is ignored by git. Summarize important evidence in docs instead of
committing huge or machine-specific logs.

## Project State Classification

Current state:

```text
Validated minimal Blender-derived WASM baseline
```

Not current state:

```text
No public artifact
Full Blender in browser
Production-ready editor
```

Near-term goal:

```text
Production-quality MVP baseline with a small real Blender data API and durable
build automation.
```

## Production Readiness Definition

This project is production ready only when all of these are true:

- A real Blender-derived WASM artifact is built reproducibly from Docker.
- The app loads the artifact without development-server import errors.
- The runtime exposes a stable documented bridge API.
- At least one bridge API performs useful Blender data work beyond logging.
- Browser tests call the bridge API and validate returned data.
- `pnpm verify` and `pnpm test:e2e` pass after a fresh artifact build.
- Artifact provenance is documented.
- Artifact delivery strategy is clear: committed public files, release asset, or
  fetch/cache step.
- No placeholder or fake Blender artifact exists anywhere in the MVP path.

## Phase 0: Baseline Preservation

Purpose: prove the current baseline still works before changing anything.

Commands:

```bash
git status --short
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
```

Acceptance criteria:

- `minimal` exits 0.
- `pnpm audit:wasm` prints `PASS: Blender WASM artifact passes minimal baseline checks.`
- `pnpm test:run` reports 143 passing tests or a clearly documented intentional
  count change.
- `pnpm test:e2e` reports 19 passing tests or a clearly documented intentional
  count change.
- The browser smoke test checks `data-testid="blender-smoke-status"` and
  `Real Blender code executed`.

If this phase fails, stop. Do not start new feature work until the baseline is
green again.

Deliverable:

```text
docs/build-notes/004-baseline-preservation.md
```

Include command output summaries and any unexpected warnings.

## Phase 1: Clean Up The Loader Path

Purpose: remove the Vite development-server warning caused by attempting to
dynamic-import `/public` assets.

Current behavior:

`EmscriptenBlenderRuntime.loadModuleFactory()` first attempts dynamic import,
then falls back to script-tag loading. With Vite, importing
`/wasm/blender/blender.js` from `public` logs a 500 warning even though fallback
loading succeeds.

Required implementation:

1. Detect that the artifact URL is under `/wasm/blender/`.
2. For public Emscripten artifacts, skip dynamic `import()`.
3. Load with a script tag first.
4. Preserve fallback behavior for future non-public ESM artifacts if needed.
5. Keep `CreateBlenderWasmModule` as the expected global factory name.

Files to inspect:

```text
src/runtime/EmscriptenBlenderRuntime.ts
tests/e2e/blender-smoke.spec.ts
```

Acceptance criteria:

- `pnpm test:e2e` still passes.
- The Vite 500 warning for `/wasm/blender/blender.js` no longer appears.
- The smoke test still displays `Real Blender code executed`.
- No changes to `public/wasm/blender/*` are needed.

Deliverable:

```text
docs/build-notes/005-loader-cleanup.md
```

## Phase 2: Make The Minimal Bridge Source Explicit

Purpose: remove temporary generated C source from `/tmp` and make the minimal
bridge auditable.

Current behavior:

`docker/blender-wasm-build/build.sh` writes `/tmp/blender_wrap.c` with a heredoc.
That works but is harder to review.

Required implementation:

1. Create:

   ```text
   docker/blender-wasm-build/minimal/blender_minimal_bridge.c
   ```

2. Move the bridge code from the heredoc into that file.
3. Update `build.sh minimal` to compile that source file.
4. Keep the same exported functions:

   ```text
   bw_get_version_json
   bw_run_smoke_test
   ```

5. Keep the smoke result string stable unless tests and docs are updated.

Acceptance criteria:

- `./scripts/build-blender-wasm.sh minimal` passes.
- `pnpm audit:wasm` passes.
- `pnpm test:e2e` passes.
- The diff is easier to audit because the bridge source is a tracked file.

Deliverable:

```text
docs/build-notes/006-explicit-minimal-bridge.md
```

## Phase 3: Build Native Blender Generator Tools

Purpose: unblock DNA/RNA-dependent Blender libraries.

Root problem:

During wasm cross-compilation, Blender builds `makesdna` as an Emscripten
JS/WASM target, then CMake tries to execute it as if it were a native host
binary:

```text
/bin/sh: 1: /build/build/bin/makesdna.js: Permission denied
```

Manual Node execution is also insufficient because the generated tool cannot
access the host filesystem correctly:

```text
Unable to open file: /build/build/source/blender/makesdna/intern/dna.c
```

Preferred solution:

Build generator tools natively in the Docker environment and make the wasm build
call those host executables.

Implementation steps:

1. Add a build mode:

   ```bash
   ./scripts/build-blender-wasm.sh host-tools
   ```

2. In Docker, create:

   ```text
   /build/host-tools
   ```

3. Configure Blender for host tools with the native compiler, not `emcmake`.

4. Build at least:

   ```text
   makesdna
   makesrna
   datatoc
   ```

5. Record tool paths, for example:

   ```text
   /build/host-tools/bin/makesdna
   /build/host-tools/bin/makesrna
   /build/host-tools/bin/datatoc
   ```

6. Patch the wasm configure path so generated-file custom commands use those
   host tool paths during cross-compilation.

Do not hand-write generated output files. Do not check in generated DNA as the
primary solution.

Acceptance criteria:

- `./scripts/build-blender-wasm.sh host-tools` exits 0.
- Native `makesdna`, `makesrna`, and `datatoc` exist and are executable.
- A wasm build uses the native tools for generation.
- `ninja -v lib/libbf_blenlib.a` progresses past the previous `makesdna.js`
  permission error.

Deliverable:

```text
docs/build-notes/007-host-tools.md
```

Include exact CMake commands and executable paths.

## Phase 4: Build The First DNA-Dependent Library

Purpose: prove the host-tool fix unblocks real Blender data libraries.

Target:

```text
lib/libbf_blenlib.a
```

Command:

```bash
docker compose -f docker/blender-wasm-build/docker-compose.yml run --rm blender-wasm-build bash -lc '
  set -euo pipefail
  source /emsdk/emsdk_env.sh >/dev/null
  cd /build/build
  ninja -v lib/libbf_blenlib.a
'
```

Acceptance criteria:

- The command exits 0.
- `lib/libbf_blenlib.a` exists.
- At least one object inside the archive has WebAssembly magic bytes.
- The failure no longer mentions `makesdna.js: Permission denied`.

Validation command:

```bash
docker compose -f docker/blender-wasm-build/docker-compose.yml run --rm blender-wasm-build bash -lc '
  set -euo pipefail
  source /emsdk/emsdk_env.sh >/dev/null
  cd /build/build
  first_member="$(/emsdk/upstream/emscripten/emar t lib/libbf_blenlib.a | head -1)"
  tmp_dir="$(mktemp -d)"
  cp lib/libbf_blenlib.a "$tmp_dir/"
  cd "$tmp_dir"
  /emsdk/upstream/emscripten/emar x libbf_blenlib.a "$first_member"
  od -An -tx1 -N8 "$first_member"
  /emsdk/upstream/bin/llvm-readobj --file-headers "$first_member"
'
```

Deliverable:

```text
docs/build-notes/008-blenlib.md
```

## Phase 5: Add One Real Data API

Purpose: move beyond logging into a useful Blender-derived API.

Recommended bridge function:

```c
char *bw_get_capabilities_json(void);
```

Minimum returned JSON:

```json
{
  "success": true,
  "build_type": "minimal-plus",
  "libraries": ["bf_intern_clog", "bf_intern_guardedalloc", "bf_blenlib"],
  "features": {
    "logging": true,
    "memory": true,
    "blenlib": true
  }
}
```

After that, add a small data operation only if the required Blender libraries
are available.

Potential next API:

```c
char *bw_create_mesh_summary_json(void);
```

Do not invent a mesh result unless it actually uses Blender data structures or
Blender utility functions. If the library requirements are not ready, document
why and stop.

Acceptance criteria:

- New bridge function is exported.
- `scripts/audit-blender-artifact.sh` checks for the new bridge symbol.
- `EmscriptenBlenderRuntime` exposes a typed method for it.
- A unit test or e2e test calls the method and validates JSON.
- Docs state exactly which Blender libraries the API depends on.

Deliverable:

```text
docs/build-notes/009-first-data-api.md
```

## Phase 6: Production Artifact Policy

Purpose: decide whether WASM artifacts belong in git.

Current artifact size is small enough to commit. Future real Blender artifacts
may become very large.

Implement one of these policies before artifacts exceed practical git size:

Option A: committed artifact

- Keep `public/wasm/blender/blender.js`.
- Keep `public/wasm/blender/blender.wasm`.
- Require `pnpm audit:wasm` before every commit that changes them.

Option B: release asset

- Remove large WASM from git.
- Add a script to download the exact release asset by version/checksum.
- Validate checksum and `pnpm audit:wasm`.

Option C: local build only

- Do not ship public artifacts in git.
- Require developers to run `./scripts/build-blender-wasm.sh minimal`.
- Keep UI error messages clear when artifacts are missing.

Do not mix policies silently.

Acceptance criteria:

- `docs/BUILD.md` states the chosen policy.
- `scripts/audit-blender-artifact.sh` enforces it.
- CI or local verification uses the same policy.

Deliverable:

```text
docs/build-notes/010-artifact-policy.md
```

## Phase 7: CI And Release Validation

Purpose: prevent regressions after handoff.

Required checks:

```bash
pnpm audit:wasm
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm test:e2e
```

If Docker is available in CI, add:

```bash
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
```

If Docker is too expensive for every PR, run it nightly or on release branches.

Acceptance criteria:

- CI fails if the public artifact is missing, fake, incomplete, or lacks required
  bridge/Blender symbols.
- CI fails if browser smoke cannot execute the WASM smoke function.
- CI publishes or preserves build logs for failed Docker builds.

Deliverable:

```text
docs/build-notes/011-ci-release-validation.md
```

## Phase 8: Production UX Hardening

Purpose: make the app honest and usable around WASM availability.

Required behavior:

- If artifacts are present and valid, `New Project` loads Blender runtime and
  shows smoke/capability status.
- If artifacts are missing, show a clear recovery command.
- If artifacts fail audit/runtime loading, show the exact failure category.
- Do not show "Blender Web Edition ready" until the smoke bridge succeeds.

Suggested UI states:

```text
Artifact missing
Artifact found
Runtime loading
Bridge validated
Smoke failed
Ready
```

Acceptance criteria:

- E2E tests cover success and missing-artifact paths.
- User-facing messages do not overclaim full Blender functionality.
- Any future "production" label is backed by the production readiness definition
  in this handoff.

Deliverable:

```text
docs/build-notes/012-production-ux.md
```

## Required Documentation Format For Every Agent Step

Each phase note must use this template:

```text
# <Phase Name>
Date:
Agent:

## Commands Run

## Result

## Artifacts Changed

## Tests Run

## Exact Failure, If Any

## Next Recommended Step
```

If a command fails, include:

```text
First failing command:
First root-cause error:
Last successful build target:
Files changed before failure:
Rollback needed: yes/no
```

## Handoff Prompt For MiniMax-M2.7

Use this exact prompt when starting the next low-cost-agent session:

```text
You are working in /nas/Temp/repos/blender-wasm.

Read docs/MINIMAX_PRODUCTION_HANDOFF.md first and follow it exactly.

Current baseline:
- public/wasm/blender/blender.js and blender.wasm are real minimal Blender-derived artifacts.
- They are built by ./scripts/build-blender-wasm.sh minimal.
- They prove Blender clog + guardedalloc code can compile/link/run in the browser.
- They are not full Blender.

Rules:
- Do not create fake artifacts.
- Do not hand-write generated Blender files.
- Do not weaken tests.
- Do not claim production readiness unless the production readiness definition is satisfied.
- Stop after one phase is complete and documented.

Start with Phase 0. Run:
git status --short
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e

Then create docs/build-notes/004-baseline-preservation.md using the required documentation template.
If Phase 0 passes, continue to Phase 1 loader cleanup. If Phase 0 fails, fix only the baseline.
```

## Final Gate Before Claiming Production Ready

Run this from a clean checkout or after removing ignored build outputs:

```bash
./scripts/build-blender-wasm.sh minimal
pnpm verify
pnpm test:e2e
```

Then inspect:

```bash
git status --short
```

Production-ready claims are allowed only when:

- The command outputs pass.
- The public artifact policy is documented.
- The runtime bridge API is documented.
- The browser test proves WASM bridge execution.
- The next docs do not contain stale claims that contradict the current state.
