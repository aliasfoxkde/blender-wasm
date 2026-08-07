# Source WASM Validation
**Date**: 2026-08-07

## Result

The project can compile real Blender source code to wasm32 and link a runnable
Emscripten module against it.

This is not a finished browser Blender MVP artifact. It is a baseline proof that
the Docker/Emscripten toolchain is producing real wasm32 output from Blender
source instead of placeholder files.

## Repeatable Command

Run this from the repository root:

```bash
./scripts/build-blender-wasm.sh validate-source
```

Expected final output:

```text
{"success":true,"linked":"bf_intern_clog","called":["CLG_init","CLG_level_set","CLG_exit"]}
```

Generated local artifacts are intentionally ignored by git:

```text
artifacts/validation/blender-validation.js
artifacts/validation/blender-validation.wasm
artifacts/logs/validate-source.log
artifacts/logs/inspect-bf_intern_clog-wasm.log
artifacts/logs/run-clog-validation-node.log
```

## What This Proves

The validation command builds these real Blender static libraries with
Emscripten:

```text
/build/build/lib/libbf_intern_clog.a
/build/build/lib/libbf_intern_guardedalloc.a
```

It then links `docker/blender-wasm-build/validation/clog_validation.c` into an
Emscripten JS/WASM pair and runs it with Emscripten's Node runtime.

The wrapper calls real Blender logging functions:

```text
CLG_init
CLG_level_set
CLG_exit
```

The archive inspection confirms the Blender object is wasm32:

```text
first-object-header:
 00 61 73 6d 01 00 00 00

File: clog.c.o
Format: WASM
Arch: wasm32
AddressSize: 32bit
Version: 0x1
```

The `00 61 73 6d` header is the WebAssembly magic number.

## Build Script Fixes

`scripts/build-blender-wasm.sh` now uses `set -euo pipefail`. This matters
because the previous script piped Docker output through `tee`; without
`pipefail`, a failed Docker command could still look successful.

The top-level wrapper now copies the canonical Docker build script into
`/build-tools/build.sh` before running it. This fixes the container failure:

```text
bash: /build-tools/build.sh: No such file or directory
```

`docker/blender-wasm-build/build.sh` now creates an empty Emscripten `libutil.a`
shim when needed:

```text
/emsdk/upstream/emscripten/cache/sysroot/lib/wasm32-emscripten/libutil.a
```

This lets `wasm-ld` resolve Blender's inherited `-lutil` linker flag for
targets that do not call `libutil` symbols.

## Libraries Successfully Compiled to WASM

The following Blender libraries compile successfully to wasm32:

```text
libbf_intern_audaspace.a     (4KB)
libbf_intern_clog.a          (11KB) ✓ VALIDATION CONFIRMED
libbf_intern_dualcon.a       (176KB)
libbf_intern_eigen.a         (199KB)
libbf_intern_guardedalloc.a  (42KB) ✓ VALIDATION CONFIRMED
libbf_intern_iksolver.a      (194KB)
libbf_intern_itasc.a         (428KB)
libbf_intern_libc_compat.a   (394 bytes)
libbf_intern_libmv.a         (4KB)
libbf_intern_opensubdiv.a    (2KB)
libbf_intern_quadriflow.a    (22KB)
libbf_intern_rigidbody.a     (68KB)
libbf_intern_sky.a           (37KB)
```

Libraries requiring DNA (blocked by makesdna):
- `libbf_intern_memutil.a` - blocked
- `libbf_intern_opencolorio.a` - blocked
- `libbf_blenlib.a` - blocked

## Full Blender Build Status

`./scripts/build-blender-wasm.sh configure` succeeds.

`ninja -v lib/libbf_intern_clog.a` succeeds and produces wasm32 objects.

`ninja -v lib/libbf_blenlib.a` is blocked at Blender's generated build tool step:

```text
/bin/sh: 1: /build/build/bin/makesdna.js: Permission denied
```

The problem: When cross-compiling, CMake builds `makesdna` as a WASM/JS target,
then tries to execute it as a native binary. The Emscripten-compiled makesdna.js
cannot access the real filesystem.

Even adding a shebang (`#!/emsdk/node/20.18.0_64bit/bin/node`) and running via Node
still fails with "Unable to open file" because Emscripten's virtual FS overlay
doesn't map to the real filesystem.

## Next Steps (In Priority Order)

1. **Build makesdna natively** - Compile Blender's generator tools with the host
   compiler and use those native binaries during the WASM build.

2. **Patch the cross-build CMake path** - When cross-compiling, make Blender's
   custom commands call the native host tools instead of `$<TARGET_FILE:makesdna>`
   from the Emscripten build.

3. **Use pre-generated DNA only as a diagnostic** - If you copy generated DNA
   files from a native build, document the source commit, command, and exact
   files. Do not treat copied generated files as the final build architecture.

4. **Keep expanding non-DNA libraries only when useful** - The minimal baseline
   can grow around libraries that do not need DNA, but that does not replace the
   host-generator fix required for real Blender data APIs.

## Do Not Mark MVP Complete Until

- A real `artifacts/blender-wasm/blender.js` and `blender.wasm` are produced
  from Blender source.
- The artifact exposes a small, documented runtime API that the web app can load.
- `pnpm audit:wasm` passes against those real artifacts.
- The files are only copied to `public/wasm/blender/` after artifact validation.
