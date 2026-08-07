# Cheap AI Recovery Guide

This guide is for MiniMax-M2.7, local Qwen, or any small/cheap coding model working on this repository.

The goal is to prevent false progress. Follow the instructions exactly.

## Non-Negotiable Rule

Do not create fake Blender artifacts.

Forbidden:

- Hard-coded Blender version strings.
- Tiny C files pretending to be Blender.
- Renaming `a.out.wasm`, `test.wasm`, or any sample WASM to `blender.wasm`.
- Creating `blender.js` by compiling a file that does not include or link Blender source.
- Marking "MVP complete" because the page loads.
- Adding tests that pass without clicking `New Project` and entering the Blender runtime path.

Required:

- Every claimed Blender artifact must be traceable to either upstream Blender source files or a wrapper linked with Blender-generated/static libraries.
- Every build claim must include the exact command and log path.
- Every failure must be recorded with the first root-cause error, not the last cascade error.

## Current Truth

There is intentionally no public Blender artifact installed.

Run:

```bash
pnpm audit:wasm
```

Expected baseline output:

```text
PASS: No public Blender WASM artifact is installed. This is an honest pre-MVP baseline.
```

This pass does not mean Blender works. It means the repository is no longer shipping a fake artifact.

## Valid MVP Target

The MVP is a headless Blender-derived runtime in the browser.

Valid success means all of these are true:

1. Docker configure is reproducible from a clean volume.
2. A Blender source target or Blender-linked wrapper compiles to WebAssembly.
3. The output uses Emscripten modularized JS:

```bash
-sMODULARIZE=1
-sEXPORT_NAME=CreateBlenderWasmModule
```

4. The output exports:

```bash
_bw_get_version_json
_bw_run_smoke_test
_malloc
_free
```

5. `src/runtime/EmscriptenBlenderRuntime.ts` can load the artifact.
6. The UI displays the smoke-test result.
7. `pnpm audit:wasm` passes.

## Invalid MVP Target

These do not count:

- A web shell that builds.
- A blank WebGL canvas.
- A tiny Emscripten hello-world file.
- A fake `bw_get_version_json()` that returns hard-coded JSON.
- A Playwright test that only checks the app title.
- A copied `.wasm` file with no provenance.

## Work Queue

Only do the first incomplete task. Stop after it passes.

### Task 1: Preserve The Honest Artifact Baseline

Run:

```bash
pnpm audit:wasm
```

Create:

```text
docs/build-notes/001-artifact-audit.md
```

Include:

- command run
- output
- conclusion: no public Blender WASM artifact is installed yet

Do not modify `public/wasm/blender/`.

### Task 2: Clean Build Configure

Run:

```bash
./scripts/build-blender-wasm.sh clean
./scripts/build-blender-wasm.sh configure
```

Required output files:

```text
artifacts/logs/configure.log
docs/build-notes/002-configure.md
```

`docs/build-notes/002-configure.md` must include:

- exact command
- whether it passed
- first 80 lines of `configure.log`
- last 120 lines of `configure.log`
- first root-cause error if failed

Do not run `ninja` until configure passes.

Do not change CMake flags blindly. If configure fails, classify the first failure:

- missing header
- missing library
- host library contamination
- unsupported Blender CMake option
- missing native build tool
- Emscripten sysroot issue

### Task 3: List Build Targets

Only start this after configure passes.

Inside the configured container/build directory, run:

```bash
ninja -t targets all > /artifacts/logs/ninja-targets.txt
```

Create:

```text
docs/build-notes/003-targets.md
```

Include:

- exact command
- path to `ninja-targets.txt`
- candidate small targets
- targets that must be avoided for MVP

Avoid:

- GHOST
- Cycles
- Python
- EEVEE/Draw engines
- full `blender` executable

Prefer:

- `bf_intern_*`
- `bf_blenlib`
- smallest target that can expose a real version/build symbol from Blender source

### Task 4: Build One Blender-Derived Static Library

Only start this after target listing exists.

Pick one small target and build it:

```bash
ninja <target-name>
```

Create:

```text
docs/build-notes/004-first-library.md
```

Include:

- exact target
- exact command
- output artifact path
- file size
- whether the output is wasm32-compatible

Do not create `public/wasm/blender/blender.wasm`.

### Task 5: Create A Real Wrapper

Only start this after at least one Blender source/static library target builds.

Create wrapper source under:

```text
docker/blender-wasm-build/mvp-wrapper/
```

The wrapper must include or link real Blender source/library output.

Minimum acceptable API:

```c
const char *bw_get_version_json(void);
const char *bw_run_smoke_test(void);
```

`bw_get_version_json()` must get version information from Blender headers, generated config, or linked Blender code. It must not hard-code `"4.2.0-emscripten"` by hand.

`bw_run_smoke_test()` must prove at least one Blender-derived symbol was used.

### Task 6: Link Browser Artifact

Use:

```bash
emcc <wrapper objects> <blender libraries> \
  -sENVIRONMENT=web \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=CreateBlenderWasmModule \
  -sEXPORTED_FUNCTIONS=_bw_get_version_json,_bw_run_smoke_test,_malloc,_free \
  -sEXPORTED_RUNTIME_METHODS=ccall,cwrap,UTF8ToString \
  -sALLOW_MEMORY_GROWTH=1 \
  -o artifacts/blender-wasm/blender.js
```

Then run:

```bash
pnpm audit:wasm
```

Only copy artifacts into `public/wasm/blender/` after `pnpm audit:wasm` passes against `artifacts/blender-wasm/` or after the audit script is honestly updated with better real-artifact checks.

## How To Report Failures

Use this exact template:

````markdown
# Build Note: <short title>

## Command

```bash
<exact command>
```

## Result

PASS or FAIL

## Log

`artifacts/logs/<file>.log`

## First Root-Cause Error

```text
<first real error>
```

## Classification

missing header | missing library | host contamination | unsupported API | CMake option | native tool | link symbol | runtime loader

## Next Proposed Fix

<one narrow fix only>
````

## Prompt To Give MiniMax

Use this prompt for the next cheap-model run:

```text
You are working in /nas/Temp/repos/blender-wasm.

Read docs/AUDIT_2026-08-07.md, docs/CHEAP_AI_RECOVERY_GUIDE.md, and docs/MVP_EXECUTION_PLAN.md.

Your task is ONLY: run the next incomplete task from docs/CHEAP_AI_RECOVERY_GUIDE.md. Do not work ahead.

Rules:
- Do not create fake Blender artifacts.
- Do not modify public/wasm/blender/* unless the guide explicitly says to.
- Do not hard-code Blender version strings.
- Do not mark MVP complete.
- Save command outputs in docs/build-notes/.
- If a command fails, document the first root-cause error and stop.

Before editing files, state which task you are doing and why.
After finishing, run only the verification command for that task.
```

## Prompt To Give Local Qwen

Use local Qwen mostly for log analysis, not broad code edits:

```text
Analyze this Blender/Emscripten build log. Find the first root-cause error only. Classify it as one of:
missing header, missing library, host contamination, unsupported API, CMake option, native tool, link symbol, runtime loader.

Do not propose broad rewrites. Give one minimal next fix and explain what command should be re-run.

<paste log excerpt>
```

## Senior-Agent Checklist

When Codex quota is available, use it for:

- reviewing build-script changes before running long Docker builds
- interpreting the first hard CMake/Ninja linker failure
- designing the real wrapper boundary
- deciding whether to patch Blender CMake or avoid a subsystem
- writing tests that prevent fake artifact regressions

Do not spend Codex quota on:

- formatting docs
- copying log excerpts
- running simple `pnpm` commands
- broad repo scans that cheap/local models can do
