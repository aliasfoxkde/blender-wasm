# Next MVP Implementation Plan For Low-Cost Agents
**Date**: 2026-08-07

## Goal

Move from the validated minimal Blender-derived WASM baseline to an honest MVP:

1. A browser-loadable Emscripten module built from Blender source.
2. A small bridge API that performs one useful Blender-adjacent operation.
3. Repeatable validation that proves the artifact is real and executable.
4. No placeholder artifacts, fake source files, or undocumented manual steps.

The current baseline is `clog + guardedalloc`. The next MVP should add only the
smallest Blender subsystem needed for a real operation.

## Non-Negotiable Rules

- Do not create fake `blender.js` or `blender.wasm`.
- Do not rename toy WASM outputs to Blender artifact names.
- Do not write fake generated Blender files such as `dna.c`.
- Do not claim "full Blender" unless the artifact contains the relevant Blender
  subsystems and the browser app exercises them.
- Every build claim must name the exact command and log file.
- Every artifact claim must be validated by `pnpm audit:wasm` or a stronger
  documented check.

## Phase 0: Preserve The Baseline

Start every work session with:

```bash
git status --short
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
```

Expected result:

```text
PASS: Blender WASM artifact passes minimal baseline checks.
```

If this fails, stop and fix the baseline before attempting new Blender
subsystems.

Deliverables:

- No unrelated source edits.
- Updated `artifacts/logs/minimal.log`.
- If behavior changes, update `docs/build-notes/002-minimal-wasm-baseline.md`.

## Phase 1: Make Validation Stronger

The browser test must prove that the runtime calls into WASM.

Required checks:

- `tests/e2e/blender-smoke.spec.ts` waits for
  `[data-testid="blender-smoke-status"]`.
- The displayed text contains `Real Blender code executed`.
- `pnpm test:e2e` passes after a fresh `minimal` build.

Do not rely on weak checks such as:

- A canvas exists.
- A global factory exists.
- The app did not crash.

Those checks are useful but insufficient.

Deliverables:

- E2E test checks the smoke result surfaced by `BlenderViewport`.
- `pnpm test:e2e` output is summarized in the build note.

## Phase 2: Fix Generated Build Tools

The main blocker is not Emscripten itself. The blocker is Blender's build-time
generators, starting with `makesdna`.

Problem:

```text
CMake cross-compiles makesdna to /build/build/bin/makesdna.js
CMake then tries to execute /build/build/bin/makesdna.js directly
```

Preferred solution:

Build generator tools natively for the host and point the wasm build at those
host executables.

Implementation steps:

1. Create a native host-tools build directory inside the Docker volume:

   ```text
   /build/host-tools
   ```

2. Configure Blender with the system compiler, not `emcmake`, for generator
   tools only.

3. Build at least:

   ```text
   makesdna
   makesrna
   datatoc
   ```

4. Patch or overlay Blender CMake so wasm target custom commands use the native
   tool paths instead of `$<TARGET_FILE:makesdna>` when cross-compiling.

5. Re-run:

   ```bash
   docker compose -f docker/blender-wasm-build/docker-compose.yml run --rm blender-wasm-build bash -lc '
     set -euo pipefail
     source /emsdk/emsdk_env.sh >/dev/null
     cd /build/build
     ninja -v lib/libbf_blenlib.a
   '
   ```

Success criteria:

- `lib/libbf_blenlib.a` builds.
- Generated files are produced by real Blender host tools.
- No generated output is hand-written.

## Phase 3: Add One Useful Blender Data API

After `blenlib` and the minimum DNA-dependent libraries build, add one real API.

Recommended first API:

```c
char *bw_create_mesh_summary_json(void);
```

It should create or inspect a tiny Blender data structure and return JSON. Keep
the operation intentionally small.

Acceptance criteria:

- The function is exported from the Emscripten module.
- The function returns structured JSON.
- A unit or browser smoke test calls it.
- The audit script checks for the bridge symbol.

Avoid adding UI features until this API exists.

## Phase 4: Replace `-sLINKABLE=1` Deliberately

`-sLINKABLE=1` is useful for proving archive contents are preserved, but it is
not the final production posture.

Before removing it:

1. Identify every C bridge function that must be exported.
2. Identify every Blender archive required by those bridge functions.
3. Use `llvm-objdump -t` before and after the change.
4. Confirm the browser smoke tests still call real Blender code.

Do not remove `-sLINKABLE=1` just to shrink the file if the result strips the
Blender symbols needed for validation.

## Phase 5: Public Artifact Policy

Public artifacts are allowed only after validation.

Required sequence:

```bash
./scripts/build-blender-wasm.sh minimal
pnpm audit:wasm
pnpm test:run
pnpm test:e2e
```

Then and only then keep:

```text
public/wasm/blender/blender.js
public/wasm/blender/blender.wasm
```

If the artifact grows beyond GitHub comfort, move it to release assets or a
documented download/cache step. Do not silently replace it with a placeholder.

## Phase 6: Documentation Discipline

For every build attempt, add or update one note under:

```text
docs/build-notes/
```

Each note must include:

- Command run.
- Exit status.
- Artifact paths and sizes.
- Exact error message if failed.
- Next recommended command.

Use this format for failed build notes:

```text
Command:
Result:
Last successful target:
First failing target:
Exact error:
Likely cause:
Next action:
```

## Current Next Command

The next high-value command is:

```bash
pnpm audit:wasm && pnpm test:run && pnpm test:e2e
```

If that passes, start Phase 2 by implementing native host tools for `makesdna`.
