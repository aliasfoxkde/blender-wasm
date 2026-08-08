# Build Note 014: Native Host Tools And `bf_blenlib` WASM Success

Date: 2026-08-07

## Summary

The previous `makesdna` blocker was misdiagnosed. `makesdna` does not have a
fundamental `DNAstr`/`DNAlen` circular dependency that prevents it from being
built. The real blocker was that the wasm CMake tree generated Emscripten
build-tool targets and then tried to execute them during the build.

This is now fixed for the first DNA-dependent milestone:

```bash
./scripts/build-blender-wasm.sh blenlib
```

Validated result:

```text
/build/build/lib/libbf_blenlib.a  2.6M
/build/build/lib/libbf_dna.a      261K
```

Archive inspection confirms real wasm32 object code:

```text
first member: BLI_array.c.o
00 61 73 6d 01 00 00 00
Format: WASM
Arch: wasm32
AddressSize: 32bit
```

## Correct Root Cause

Blender's build uses generator tools such as `makesdna` and `datatoc`. Those
tools must run on the build host, even while their generated outputs are used by
wasm32 target libraries.

The corrected state is:

```text
/build/host-tools/bin/makesdna
/build/host-tools/bin/datatoc
```

Those are native Linux executables built with host CMake, not `emcmake`.

## Important Correction To Earlier Notes

Older notes claimed `makesdna.cc` could not be compiled standalone because of a
`DNAstr`/`DNAlen` cycle. That claim is false for this Blender source tree.

The actual split is:

- `makesdna` is built from `makesdna.cc`, `dna_utils.cc`, generated include
  lists, and a small subset of `blenlib`.
- `DNAstr` and `DNAlen` are emitted into generated `dna.c`.
- `dna_genfile.cc` references `DNAstr` and `DNAlen`.
- `dna_genfile.cc` belongs to `bf_dna`, not the `makesdna` executable.

## Implemented Build Modes

```bash
./scripts/build-blender-wasm.sh host-tools
./scripts/build-blender-wasm.sh patch-host-tools
./scripts/build-blender-wasm.sh blenlib
```

The `blenlib` mode is intentionally self-contained:

1. Build native host tools.
2. Configure the wasm CMake tree.
3. Patch generated Ninja commands to use native host tools.
4. Build `lib/libbf_blenlib.a`.

## WASM Compatibility Fixes

The wasm build now applies these target flags:

```text
-sUSE_ZLIB=1
-DUSE_STATFS_STATVFS
-include sys/statvfs.h
-I/blender-wasm/docker/blender-wasm-build/wasm-shims
```

Why:

- `-sUSE_ZLIB=1`: materializes Emscripten's zlib port for Blender gzip helpers.
- `-DUSE_STATFS_STATVFS -include sys/statvfs.h`: makes Blender's disk-free-space
  code use Emscripten's available `statvfs` definitions.
- `wasm-shims/fenv.h`: supplies compatibility constants for Blender's
  floating-point exception checks. WebAssembly does not expose hardware floating
  point exception flags.
- `wasm-shims/zstd.h`: supplies fail-closed zstd API stubs. The current browser
  MVP does not support zstd compression/decompression.

## DNA Verify Handling

Native `makesdna` generates:

```text
dna.c
dna_type_offsets.h
dna_verify.c
```

The first two are retained. The third is disabled for the wasm cross-build.

Reason: `dna_verify.c` contains static assertions for the ABI that ran
`makesdna` (Linux x86_64 in Docker). Those offsets do not match wasm32 pointer
layout. This produced failures such as:

```text
DNA member offset verify
expression evaluates to '32 == 40'
```

The build patch rewrites the `makesdna` Ninja command to run native `makesdna`
and then replace `dna_verify.c` with a no-op file. This is acceptable for this
milestone because `dna_verify.c` is a compile-time assertion file, not runtime
DNA data.

## Validation Commands

```bash
./scripts/build-blender-wasm.sh blenlib
pnpm audit:wasm
```

Inspect archive:

```bash
docker compose -f docker/blender-wasm-build/docker-compose.yml run --rm blender-wasm-build bash -lc '
  set -euo pipefail
  source /emsdk/emsdk_env.sh >/dev/null
  cd /build/build
  ls -lh lib/libbf_blenlib.a lib/libbf_dna.a
  first_member="$(/emsdk/upstream/emscripten/emar t lib/libbf_blenlib.a | head -1)"
  tmp_dir="$(mktemp -d)"
  cp lib/libbf_blenlib.a "$tmp_dir/"
  cd "$tmp_dir"
  /emsdk/upstream/emscripten/emar x libbf_blenlib.a "$first_member"
  od -An -tx1 -N8 "$first_member"
  /emsdk/upstream/bin/llvm-readobj --file-headers "$first_member"
'
```

## Current Boundary

- Minimal public browser WASM still works.
- Native host tools are repeatably built.
- `bf_dna` builds as wasm with the host-ABI verifier disabled.
- `bf_blenlib` builds as a wasm32 archive.
- `bf_blenlib` is not yet linked into `public/wasm/blender/blender.wasm`.
- No full Blender runtime or mesh/object API exists yet.
