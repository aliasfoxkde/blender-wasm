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

## Full Blender Build Status

`./scripts/build-blender-wasm.sh configure` succeeds.

`ninja -v lib/libbf_intern_clog.a` succeeds and produces wasm32 objects.

`ninja -v lib/libbf_blenlib.a` progresses further after the `libutil.a` shim,
but the build remains blocked at Blender's generated build tool step:

```text
/bin/sh: 1: /build/build/bin/makesdna.js: Permission denied
```

The failing CMake rule is in Blender source:

```text
source/blender/makesdna/intern/CMakeLists.txt
```

It builds `makesdna` as the current target platform and then invokes:

```text
$<TARGET_FILE:makesdna>
```

In this wasm cross-compile, that target is emitted as `makesdna.js`. The build
system then tries to execute the JS file directly as if it were a native host
binary.

Manually invoking it through Emscripten's Node runtime gets past the shell
permission problem but hits filesystem access:

```text
Unable to open file: /build/build/source/blender/makesdna/intern/dna.c
```

The next fix should address Blender build tools deliberately. Do not work
around this by creating fake `dna.c`, fake `blender.js`, or fake
`blender.wasm`.

## Recommended Next Step

Patch the cross-build handling for generated build tools.

The clean options are:

1. Build generator tools such as `makesdna` and `makesrna` as native host tools
   and use those host executables during the wasm build.
2. Or keep them as Emscripten JS tools, but make CMake invoke them through
   Emscripten's Node runtime and link them with filesystem access suitable for
   the generated-output paths.

Prefer option 1 for MVP reliability. Blender expects these tools to run at
build time, not in the browser.

## Do Not Mark MVP Complete Until

- A real `artifacts/blender-wasm/blender.js` and `blender.wasm` are produced
  from Blender source.
- The artifact exposes a small, documented runtime API that the web app can load.
- `pnpm audit:wasm` passes against those real artifacts.
- The files are only copied to `public/wasm/blender/` after artifact validation.
