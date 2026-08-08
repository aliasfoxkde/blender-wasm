#!/usr/bin/env bash
# configure-cycles.sh
# Configures the Cycles standalone CMake build for WASM.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${ROOT}/build.config.env"
source "${SCRIPT_DIR}/dep-common.sh"

BLENDER_DIR="${ROOT}/blender"

# Verify toolchain
if [ ! -f "${EMSDK}/emsdk_env.sh" ]; then
    echo "ERROR: emsdk not found at ${EMSDK}" >&2
    echo "Run: bash real-render/scripts/setup-toolchain.sh" >&2
    exit 1
fi
source "${EMSDK}/emsdk_env.sh"

if ! command -v emcmake &> /dev/null; then
    echo "ERROR: emcmake not found — Emscripten not properly activated" >&2
    exit 1
fi

# Verify sysroot
if [ ! -d "${SYSROOT}/lib" ]; then
    echo "ERROR: sysroot not found at ${SYSROOT}" >&2
    echo "Run: bash real-render/scripts/build-deps-minimal.sh first" >&2
    exit 1
fi

BUILD_DIR="${ROOT}/build-cycles"
mkdir -p "${BUILD_DIR}"

echo "=========================================="
echo "Configuring Cycles standalone WASM build"
echo "=========================================="
echo "Blender : ${BLENDER_DIR}"
echo "Sysroot : ${SYSROOT}"
echo "Build   : ${BUILD_DIR}"

cd "${BUILD_DIR}"

# CMAKE_PREFIX_PATH lets find_package() locate our dependency installs
emcmake cmake \
    -S "${BLENDER_DIR}" \
    -B "${BUILD_DIR}" \
    -C "${ROOT}/cmake/cycles-wasm-cache.cmake" \
    -DCMAKE_PREFIX_PATH="${SYSROOT}" \
    -DCMAKE_C_FLAGS="-pthread -fexceptions -include ${ROOT}/cmake/wasm_compat.h ${WASM_CFLAGS}" \
    -DCMAKE_CXX_FLAGS="-pthread -fexceptions -include ${ROOT}/cmake/wasm_compat.h ${WASM_CXXFLAGS}" \
    -GNinja

echo ""
echo "CMake configured. Build with:"
echo "  ninja -C ${BUILD_DIR} -j ${BUILD_JOBS} cycles"
echo ""
echo "Or run: bash real-render/scripts/build-cycles.sh"
