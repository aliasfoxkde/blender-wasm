# MiniMax Next Handoff: From `bf_blenlib` Baseline To Production MVP

Date: 2026-08-07

This is the current source of truth for the next implementation pass. Do not
continue from the old claim that `makesdna` has an unsolvable circular
dependency. That claim was audited and is incorrect.

## Verified Current State

The repo now has two separate validated baselines:

1. Public browser artifact:

   ```bash
   pnpm audit:wasm
   ```

   Scope: minimal real Blender-derived WASM with `clog` and `guardedalloc`.

2. First DNA-dependent wasm static library:

   ```bash
   ./scripts/build-blender-wasm.sh blenlib
   ```

   Current result:

   ```text
   /build/build/lib/libbf_blenlib.a  2.6M
   /build/build/lib/libbf_dna.a      261K
   ```

## Non-Negotiable Rules

- Do not create placeholder APIs and call them complete.
- Do not hand-write fake Blender output.
- Do not edit generated files in `/build/build` as the primary solution.
- Do not reintroduce `/build/build/bin/makesdna.js` or `/build/build/bin/datatoc.js`
  as executable build tools.
- Do not claim full Blender works until an exported browser WASM module calls
  the relevant Blender code and tests prove it.
- Keep each phase independently verifiable with one command.
- When blocked, record the first compiler or linker error exactly and stop
  changing unrelated code.

## Correct Mental Model

Cross-compilation has two kinds of artifacts:

- Host tools: native Linux executables that run during the build.
- Target libraries: wasm32 object code and archives that run in the browser.

`makesdna` and `datatoc` are host tools. `bf_dna`, `bf_blenlib`, and future
Blender libraries are wasm32 target libraries.

## Phase 1: Preserve And Gate The Current Baselines

Goal: make future regressions obvious.

Commands:

```bash
bash -n docker/blender-wasm-build/build.sh scripts/build-blender-wasm.sh
pnpm audit:wasm
./scripts/build-blender-wasm.sh blenlib
```

Acceptance criteria:

- All commands exit 0.
- `public/wasm/blender/blender.wasm` remains auditable as the minimal artifact.
- `/build/build/lib/libbf_blenlib.a` exists.
- `/build/build/lib/libbf_dna.a` exists.

Implementation tasks:

1. Add `scripts/audit-blenlib-artifact.sh`.
2. The script must verify archive existence, wasm magic bytes, `Format: WASM`,
   `Arch: wasm32`, and `AddressSize: 32bit`.
3. Add `audit:blenlib` to `package.json`.
4. Do not put the Docker-heavy `blenlib` build in default CI until runtime is
   acceptable.

## Phase 2: Link `bf_blenlib` Into An Experimental WASM Module

Goal: prove a public Emscripten module can call real `blenlib` functions.

Do not replace the existing public minimal artifact yet. Create:

```text
artifacts/blender-wasm/blender_blenlib.js
artifacts/blender-wasm/blender_blenlib.wasm
```

Recommended exported functions:

```c
const char *bw_blenlib_capabilities_json(void);
int bw_blenlib_smoke_test(void);
uint32_t bw_hash_string_mm2a(const char *value);
```

Acceptance criteria:

- The experimental `.wasm` is larger than the minimal artifact.
- Export inspection shows the new `bw_blenlib_*` symbols.
- A Node smoke test loads the module and calls the exported functions.
- The existing minimal public artifact still passes `pnpm audit:wasm`.

## Phase 3: Decide Zstd Policy Before File Loading Claims

Current zstd state:

- `docker/blender-wasm-build/wasm-shims/zstd.h` is a compile-time compatibility
  shim.
- zstd calls fail closed by returning error-like values.
- This is acceptable for building `bf_blenlib`.
- This is not acceptable for claiming production `.blend` file loading support
  for zstd-compressed data.

Recommended MVP policy: keep zstd disabled until a real `.blend` loading
milestone requires it, and make unsupported zstd paths fail explicitly.

## Phase 4: Replace Ninja Text Patching With CMake-Level Host Tool Wiring

The current `patch-host-tools` implementation is acceptable for the baseline,
but it is not the final architecture.

Target durable solution:

- Introduce a Blender CMake overlay or patch file that makes generator tool
  paths explicit when cross-compiling.
- Avoid editing generated `build.ninja` directly once the correct CMake hook is
  identified.
- Keep `dna_verify.c` handling explicit and documented.

Do not attempt this before Phase 2 unless the current patching becomes unstable.

## Phase 5: Build The First Useful Browser-Facing API

Goal: move from internal library proof to a real user-visible capability.

Recommended first capability:

- A deterministic data utility or math/path utility backed by `blenlib`.
- Avoid mesh/object editing until more Blender data libraries are linked.

Rules:

- The API must call real Blender code.
- The API must have a TypeScript wrapper.
- Unit tests must assert exact output.
- The UI must not imply full Blender editing.

## Phase 6: Public Artifact Promotion

Only promote the experimental `blenlib` module to `public/wasm/blender` after:

- Node smoke test passes.
- Browser smoke test passes.
- Existing minimal API still works or has a migration path.
- Artifact audit can distinguish minimal, blenlib, and future full-runtime
  baselines.

## Immediate Next Command

Start here:

```bash
bash -n docker/blender-wasm-build/build.sh scripts/build-blender-wasm.sh
pnpm audit:wasm
./scripts/build-blender-wasm.sh blenlib
```

Then implement Phase 1 exactly. Do not start Phase 2 until Phase 1 is committed.
