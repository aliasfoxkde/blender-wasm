#!/bin/bash
# Blender WASM Build Script
# Uses stub find modules for cross-compilation to WebAssembly
#
# The stubs provide empty libraries during CMake config phase.
# Emscripten ports provide the actual WASM libraries at link time via -sUSE_* flags.
#
# Usage:
#   build.sh configure        # Run CMake configure only
#   build.sh build            # Run configure + Ninja build
#   build.sh minimal          # Build public minimal Blender-derived WASM artifact
#   build.sh validate-source  # Compile/link/run a minimal real Blender WASM proof
#   build.sh host-tools       # Build native Blender generator tools
#   build.sh patch-host-tools # Patch configured wasm Ninja build to use native tools
#   build.sh blenlib          # Build first DNA-dependent wasm library using native tools

set -euo pipefail

# Source Emscripten
source /emsdk/emsdk_env.sh

# Build configuration
BUILD_TYPE="${BUILD_TYPE:-Release}"
BUILD_DIR="${BUILD_DIR:-/build/build}"
BLENDER_SRC="${BLENDER_SRC:-/build/src}"
OPENIMAGEIO_ROOT="${OPENIMAGEIO_ROOT:-/openimageio-stub}"
STUB_DIR="${STUB_DIR:-/cmake-stubs}"
ARTIFACTS_DIR="${ARTIFACTS_DIR:-/artifacts}"
EMSCRIPTEN_SYSROOT="${EMSCRIPTEN_SYSROOT:-/emsdk/upstream/emscripten/cache/sysroot}"
EMSCRIPTEN_LIB_DIR="$EMSCRIPTEN_SYSROOT/lib/wasm32-emscripten"
BLENDER_WASM_PUBLIC_DIR="${BLENDER_WASM_PUBLIC_DIR:-/blender-wasm/public/wasm/blender}"
HOST_TOOLS_DIR="${HOST_TOOLS_DIR:-/build/host-tools}"
WASM_SHIM_DIR="${WASM_SHIM_DIR:-/blender-wasm/docker/blender-wasm-build/wasm-shims}"
WASM_COMMON_FLAGS="${WASM_COMMON_FLAGS:--sUSE_ZLIB=1 -DUSE_STATFS_STATVFS -include sys/statvfs.h -I${WASM_SHIM_DIR}}"
WASM_LINKER_FLAGS="${WASM_LINKER_FLAGS:--sUSE_ZLIB=1}"

MODE="${1:-build}"

echo "=========================================="
echo "Blender WASM Build ($MODE)"
echo "=========================================="
echo "Build Type: $BUILD_TYPE"
echo "Build Dir: $BUILD_DIR"
echo "Blender Src: $BLENDER_SRC"
echo "OpenImageIO: $OPENIMAGEIO_ROOT"
echo "Stub Modules: $STUB_DIR"
echo "Artifacts: $ARTIFACTS_DIR"
echo "Host Tools: $HOST_TOOLS_DIR"
echo "WASM Shims: $WASM_SHIM_DIR"
echo "=========================================="

# Blender's Unix CMake platform may add -lutil for build tools such as makesdna.
# Emscripten does not ship libutil because the relevant POSIX APIs are not
# available in browsers. Provide an empty archive so wasm-ld can resolve -lutil
# for code paths that do not actually call libutil symbols.
mkdir -p "$EMSCRIPTEN_LIB_DIR"
if [ ! -f "$EMSCRIPTEN_LIB_DIR/libutil.a" ]; then
    echo "Creating empty Emscripten libutil shim at $EMSCRIPTEN_LIB_DIR/libutil.a"
    /emsdk/upstream/emscripten/emar rcs "$EMSCRIPTEN_LIB_DIR/libutil.a"
fi

configure_cmake() {
    # CMAKE_MODULE_PATH points to our stub find modules first so Blender's CMake
    # does not accidentally pick host x86_64 system libraries for wasm32 output.
    emcmake cmake "$BLENDER_SRC" \
        -G Ninja \
        -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
        -DCMAKE_MODULE_PATH="$STUB_DIR;${CMAKE_MODULE_PATH:-}" \
        -DCMAKE_SYSROOT="$EMSCRIPTEN_SYSROOT" \
        -DCMAKE_C_FLAGS="${WASM_COMMON_FLAGS} ${CMAKE_C_FLAGS:-}" \
        -DCMAKE_CXX_FLAGS="${WASM_COMMON_FLAGS} ${CMAKE_CXX_FLAGS:-}" \
        -DCMAKE_EXE_LINKER_FLAGS="${WASM_LINKER_FLAGS} ${CMAKE_EXE_LINKER_FLAGS:-}" \
        -DWITH_OPENIMAGEIO=ON \
        -DOPENIMAGEIO_ROOT="$OPENIMAGEIO_ROOT" \
        -DWITH_CYCLES=OFF \
        -DWITH_CYCLES_EMBREE=OFF \
        -DWITH_CYCLES_OSL=OFF \
        -DWITH_GHOST_X11=OFF \
        -DWITH_GHOST_WAYLAND=OFF \
        -DWITH_GHOST_SDL=OFF \
        -DWITH_PYTHON=OFF \
        -DWITH_LIBMV=OFF \
        -DWITH_DOCUMENTATION=OFF \
        -DWITH_INSTALL=OFF \
        -DWITH_TESTS=OFF \
        -DWITH_JACK=OFF \
        -DWITH_PULSEAUDIO=OFF \
        -DWITH_PIPEWIRE=OFF \
        -DWITH_LIBS_PRECOMPILED=OFF \
        -DWITH_VULKAN=OFF \
        -DWITH_GHOST_NATIVE=OFF
}

host_tool_cmake_flags() {
    cat <<'EOF'
-DCMAKE_BUILD_TYPE=Release
-DCMAKE_MODULE_PATH=/cmake-stubs
-DWITH_OPENIMAGEIO=OFF
-DWITH_CYCLES=OFF
-DWITH_CYCLES_EMBREE=OFF
-DWITH_CYCLES_OSL=OFF
-DWITH_GHOST_X11=OFF
-DWITH_GHOST_WAYLAND=OFF
-DWITH_GHOST_SDL=OFF
-DWITH_PYTHON=OFF
-DWITH_LIBMV=OFF
-DWITH_DOCUMENTATION=OFF
-DWITH_INSTALL=OFF
-DWITH_TESTS=OFF
-DWITH_JACK=OFF
-DWITH_PULSEAUDIO=OFF
-DWITH_PIPEWIRE=OFF
-DWITH_LIBS_PRECOMPILED=OFF
-DWITH_VULKAN=OFF
-DWITH_GHOST_NATIVE=OFF
-DWITH_CODEC_FFMPEG=OFF
-DWITH_IMAGE_OPENJPEG=OFF
-DWITH_IMAGE_TIFF=OFF
-DWITH_IMAGE_WEBP=OFF
-DWITH_OPENAL=OFF
-DWITH_AUDASPACE=OFF
-DWITH_OPENCOLORIO=OFF
-DWITH_OPENEXR=OFF
-DWITH_OPENVDB=OFF
-DWITH_ALEMBIC=OFF
-DWITH_USD=OFF
-DWITH_COLLADA=OFF
-DWITH_FREESTYLE=OFF
-DWITH_MOD_FLUID=OFF
-DWITH_BULLET=OFF
-DWITH_BOOST=OFF
EOF
}

ensure_configured() {
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"

    if [ -f "$BUILD_DIR/build.ninja" ]; then
        echo "Using existing CMake configuration at $BUILD_DIR"
        return
    fi

    echo "Running CMake configure..."
    configure_cmake
}

build_host_tools() {
    mkdir -p "$HOST_TOOLS_DIR" "$ARTIFACTS_DIR/logs"
    cd "$HOST_TOOLS_DIR"

    echo ""
    echo "=========================================="
    echo "Configuring native Blender host tools..."
    echo "=========================================="

    # Use the host compiler, not emcmake. These tools run during the build.
    cmake "$BLENDER_SRC" -G Ninja $(host_tool_cmake_flags) \
        2>&1 | tee "$ARTIFACTS_DIR/logs/host-tools-configure.log"

    echo ""
    echo "=========================================="
    echo "Building native makesdna and datatoc..."
    echo "=========================================="
    ninja -v makesdna datatoc \
        2>&1 | tee "$ARTIFACTS_DIR/logs/host-tools-build.log"

    test -x "$HOST_TOOLS_DIR/bin/makesdna"
    test -x "$HOST_TOOLS_DIR/bin/datatoc"

    echo ""
    echo "Native host tools:"
    ls -lh "$HOST_TOOLS_DIR/bin/makesdna" "$HOST_TOOLS_DIR/bin/datatoc"
}

patch_wasm_host_tools() {
    ensure_configured

    test -x "$HOST_TOOLS_DIR/bin/makesdna"
    test -x "$HOST_TOOLS_DIR/bin/datatoc"
    test -f "$BUILD_DIR/build.ninja"

    echo ""
    echo "=========================================="
    echo "Patching wasm Ninja build to use native host tools..."
    echo "=========================================="

    perl -0pi -e \
        "s#${BUILD_DIR}/bin/makesdna\\.js#${HOST_TOOLS_DIR}/bin/makesdna#g; s#${BUILD_DIR}/bin/datatoc\\.js#${HOST_TOOLS_DIR}/bin/datatoc#g" \
        "$BUILD_DIR/build.ninja"

    # Native makesdna can generate dna.c for the wasm build, but the generated
    # dna_verify.c contains static assertions for the ABI that ran makesdna
    # (Linux x86_64 here). Those assertions do not match wasm32 pointer layout.
    # Keep the real generated DNA data, but make the verifier a no-op for this
    # cross-build so bf_dna can compile for the target ABI.
    perl -0pi -e \
        "s#(${HOST_TOOLS_DIR}/bin/makesdna ${BUILD_DIR}/source/blender/makesdna/intern/dna\\.c ${BUILD_DIR}/source/blender/makesdna/intern/dna_type_offsets\\.h ${BUILD_DIR}/source/blender/makesdna/intern/dna_verify\\.c ${BLENDER_SRC}/source/blender/makesdna/)#\$1 \&\& printf '/\\* wasm cross-build: dna_verify.c is host-ABI-specific and intentionally disabled. \\*/\\\\n' > ${BUILD_DIR}/source/blender/makesdna/intern/dna_verify.c#g" \
        "$BUILD_DIR/build.ninja"

    echo "Patched references:"
    grep -n "${HOST_TOOLS_DIR}/bin/makesdna\\|${HOST_TOOLS_DIR}/bin/datatoc" "$BUILD_DIR/build.ninja" | head -20 || true
}

build_blenlib() {
    build_host_tools
    mkdir -p "$BUILD_DIR"
    cd "$BUILD_DIR"
    configure_cmake
    patch_wasm_host_tools

    cd "$BUILD_DIR"
    mkdir -p "$ARTIFACTS_DIR/logs"

    echo ""
    echo "=========================================="
    echo "Building first DNA-dependent wasm library: libbf_blenlib.a"
    echo "=========================================="
    ninja -v lib/libbf_blenlib.a \
        2>&1 | tee "$ARTIFACTS_DIR/logs/build-bf_blenlib-with-host-tools.log"

    echo ""
    echo "Result:"
    ls -lh "$BUILD_DIR/lib/libbf_blenlib.a"
}

build_blenlib_module() {
    # Build the blenlib library first
    build_blenlib

    mkdir -p "$ARTIFACTS_DIR/blender-wasm"

    echo ""
    echo "=========================================="
    echo "Linking experimental blenlib WASM module..."
    echo "=========================================="

    # Link the blenlib bridge with blenlib library. Do not use -sLINKABLE=1
    # here: this module intentionally exports the bridge API only. LINKABLE
    # forces whole-archive behavior and pulls unrelated optional blenlib code
    # that requires deps such as fmt, xxhash, and zlib even when unused.
    em++ /blender-wasm/docker/blender-wasm-build/blenlib/blender_blenlib_bridge.cc \
        "$BUILD_DIR/lib/libbf_blenlib.a" \
        "$BUILD_DIR/lib/libbf_dna.a" \
        "$BUILD_DIR/lib/libbf_intern_clog.a" \
        "$BUILD_DIR/lib/libbf_intern_guardedalloc.a" \
        "$BUILD_DIR/lib/libbf_intern_libc_compat.a" \
        -I"$BLENDER_SRC/intern/clog" \
        -I"$BLENDER_SRC/intern/guardedalloc" \
        -I"$BLENDER_SRC/intern/guardedalloc/intern" \
        -I"$BLENDER_SRC/intern/atomic" \
        -I"$BLENDER_SRC/source/blender/blenlib" \
        -I"$BLENDER_SRC/source/blender/blenlib/intern" \
        -I"$BLENDER_SRC/source/blender/makesdna" \
        -sMODULARIZE=1 \
        -sEXPORT_NAME=CreateBlenderBlenlibModule \
        -sEXPORTED_FUNCTIONS=_bw_blenlib_capabilities_json,_bw_blenlib_smoke_test,_bw_hash_string_mm2a,_malloc,_free \
        -sEXPORTED_RUNTIME_METHODS=UTF8ToString,stringToUTF8 \
        -sALLOW_MEMORY_GROWTH=1 \
        -sINITIAL_MEMORY=16777216 \
        -sWASM=1 \
        -o "$ARTIFACTS_DIR/blender-wasm/blender_blenlib.js"

    echo ""
    echo "=========================================="
    echo "Experimental blenlib module built!"
    echo "=========================================="
    ls -lh "$ARTIFACTS_DIR/blender-wasm/blender_blenlib.js" "$ARTIFACTS_DIR/blender-wasm/blender_blenlib.wasm" 2>/dev/null || \
    ls -lh "$ARTIFACTS_DIR/blender-wasm/blender_blenlib.js" 2>/dev/null || echo "Check artifacts"
}

build_minimal() {
    ensure_configured
    mkdir -p "$ARTIFACTS_DIR/blender-wasm" "$BLENDER_WASM_PUBLIC_DIR"

    echo ""
    echo "=========================================="
    echo "Building minimal Blender WASM from real source..."
    echo "=========================================="

    # Build the libraries we can compile without DNA
    ninja -j$(nproc) \
        lib/libbf_intern_clog.a \
        lib/libbf_intern_guardedalloc.a \
        lib/libbf_intern_libc_compat.a \
        lib/libbf_intern_eigen.a \
        lib/libbf_intern_sky.a \
        lib/libbf_intern_audaspace.a \
        lib/libbf_intern_dualcon.a \
        lib/libbf_intern_iksolver.a \
        lib/libbf_intern_itasc.a \
        lib/libbf_intern_libmv.a \
        lib/libbf_intern_opensubdiv.a \
        lib/libbf_intern_quadriflow.a \
        lib/libbf_intern_rigidbody.a

    echo ""
    echo "=========================================="
    echo "Linking minimal Blender module..."
    echo "=========================================="

    # Link with Blender libraries using explicit bridge source
    # NOTE: -sLINKABLE=1 is required to prevent dead code elimination from
    # stripping archive members. Without it, wasm-ld removes "unused" symbols
    # even when --whole-archive is specified.
    emcc /blender-wasm/docker/blender-wasm-build/minimal/blender_minimal_bridge.c \
        lib/libbf_intern_clog.a \
        lib/libbf_intern_guardedalloc.a \
        lib/libbf_intern_libc_compat.a \
        -I"$BLENDER_SRC/intern/clog" \
        -I"$BLENDER_SRC/intern/guardedalloc" \
        -I"$BLENDER_SRC/intern/atomic" \
        -sLINKABLE=1 \
        -sMODULARIZE=1 \
        -sEXPORT_NAME=CreateBlenderWasmModule \
        -sEXPORTED_FUNCTIONS=_bw_get_version_json,_bw_run_smoke_test,_bw_get_memory_stats,_bw_get_api_summary,_malloc,_free \
        -sEXPORTED_RUNTIME_METHODS=UTF8ToString \
        -sALLOW_MEMORY_GROWTH=1 \
        -sINITIAL_MEMORY=16777216 \
        -sWASM=1 \
        -o "$ARTIFACTS_DIR/blender-wasm/blender.js"

    # Copy wasm binary
    cp "${ARTIFACTS_DIR}/blender-wasm/blender.js" "$BLENDER_WASM_PUBLIC_DIR/" 2>/dev/null || true

    # Create the .wasm file alongside the .js
    # The emcc output includes both files
    if [ -f "$ARTIFACTS_DIR/blender-wasm/blender.wasm" ]; then
        cp "$ARTIFACTS_DIR/blender-wasm/blender.wasm" "$BLENDER_WASM_PUBLIC_DIR/" 2>/dev/null || true
    fi

    echo ""
    echo "=========================================="
    echo "Minimal build complete!"
    echo "=========================================="
    ls -lh "$ARTIFACTS_DIR/blender-wasm/" 2>/dev/null || echo "No artifacts"
}

validate_source() {
    ensure_configured

    mkdir -p "$ARTIFACTS_DIR/logs" "$ARTIFACTS_DIR/validation"

    echo ""
    echo "=========================================="
    echo "Building minimal Blender source libraries..."
    echo "=========================================="
    ninja -v lib/libbf_intern_clog.a lib/libbf_intern_guardedalloc.a

    echo ""
    echo "=========================================="
    echo "Inspecting wasm32 object output..."
    echo "=========================================="
    /emsdk/upstream/emscripten/emar t lib/libbf_intern_clog.a | tee "$ARTIFACTS_DIR/logs/inspect-bf_intern_clog-wasm.log"
    first_member="$(/emsdk/upstream/emscripten/emar t lib/libbf_intern_clog.a | head -1)"
    tmp_dir="$(mktemp -d)"
    cp lib/libbf_intern_clog.a "$tmp_dir/"
    (
        cd "$tmp_dir"
        /emsdk/upstream/emscripten/emar x libbf_intern_clog.a "$first_member"
        echo "first-object-header:"
        od -An -tx1 -N8 "$first_member"
        echo "llvm-readobj:"
        /emsdk/upstream/bin/llvm-readobj --file-headers "$first_member"
    ) | tee -a "$ARTIFACTS_DIR/logs/inspect-bf_intern_clog-wasm.log"
    rm -rf "$tmp_dir"

    echo ""
    echo "=========================================="
    echo "Linking validation module..."
    echo "=========================================="
    emcc /blender-wasm/docker/blender-wasm-build/validation/clog_validation.c \
        lib/libbf_intern_clog.a lib/libbf_intern_guardedalloc.a \
        -I"$BLENDER_SRC/intern/clog" \
        -I"$BLENDER_SRC/intern/guardedalloc" \
        -I"$BLENDER_SRC/intern/atomic" \
        -sENVIRONMENT=web,node \
        -sMODULARIZE=1 \
        -sEXPORT_NAME=CreateBlenderValidationModule \
        -sEXPORTED_FUNCTIONS=_bw_validation_status,_malloc,_free \
        -sEXPORTED_RUNTIME_METHODS=ccall,cwrap,UTF8ToString \
        -sALLOW_MEMORY_GROWTH=1 \
        -o "$ARTIFACTS_DIR/validation/blender-validation.js"

    echo ""
    echo "=========================================="
    echo "Running validation module under Node..."
    echo "=========================================="
    (
        cd "$ARTIFACTS_DIR/validation"
        /emsdk/node/20.18.0_64bit/bin/node - <<'NODE'
const create = require("./blender-validation.js");
create()
  .then((module) => {
    console.log(module.UTF8ToString(module._bw_validation_status()));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
NODE
    ) | tee "$ARTIFACTS_DIR/logs/run-clog-validation-node.log"

    echo ""
    echo "Validation artifacts:"
    ls -lh "$ARTIFACTS_DIR/validation"
}

case "$MODE" in
    configure)
        mkdir -p "$BUILD_DIR"
        cd "$BUILD_DIR"
        echo "Running CMake configure..."
        configure_cmake
        ;;
    build)
        mkdir -p "$BUILD_DIR"
        cd "$BUILD_DIR"
        echo "Running CMake configure..."
        configure_cmake
        ;;
    validate-source)
        validate_source
        ;;
    minimal)
        build_minimal
        ;;
    host-tools)
        build_host_tools
        ;;
    patch-host-tools)
        patch_wasm_host_tools
        ;;
    blenlib)
        build_blenlib
        ;;
    blenlib-module)
        build_blenlib_module
        ;;
    *)
        echo "Unknown mode: $MODE"
        echo "Usage: build.sh {configure|build|validate-source|minimal|host-tools|patch-host-tools|blenlib|blenlib-module}"
        exit 1
        ;;
esac

if [ "$MODE" = "configure" ] || [ "$MODE" = "build" ]; then
    echo ""
    echo "=========================================="
    echo "CMake configuration complete!"
    echo "=========================================="
    echo ""
    echo "To build: ninja -j\$(nproc)"
    echo ""
    echo "Note: Link with Emscripten ports for actual libraries:"
    echo "  -sUSE_LIBJPEG=1 -sUSE_LIBPNG=1 -sUSE_ZLIB=1"
fi

if [ "$MODE" = "build" ]; then
    echo ""
    echo "=========================================="
    echo "Running Ninja build..."
    echo "=========================================="
    ninja -j$(nproc)

    echo ""
    echo "=========================================="
    echo "Build complete!"
    echo "=========================================="
    echo "Finding artifacts..."

    # Find and copy Blender JS/WASM files
    mkdir -p "$ARTIFACTS_DIR/blender-wasm"

    # Look for Emscripten output (blender.js, blender.wasm)
    for f in $(find "$BUILD_DIR" -name "blender.js" -o -name "blender.wasm" 2>/dev/null); do
        echo "Found: $f"
        cp "$f" "$ARTIFACTS_DIR/blender-wasm/"
    done

    # Also check for makesdna and other built targets
    if [ -d "$BUILD_DIR/bin" ]; then
        cp -r "$BUILD_DIR/bin" "$ARTIFACTS_DIR/" 2>/dev/null || true
    fi

    echo ""
    echo "Artifacts in $ARTIFACTS_DIR/blender-wasm/:"
    ls -la "$ARTIFACTS_DIR/blender-wasm/" 2>/dev/null || echo "No artifacts found"
fi
