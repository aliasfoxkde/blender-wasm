#!/usr/bin/env bash
# build_imath.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

# Imath 3.1 builds cleanly with CMake + Emscripten
IMATH_VERSION=3.1.11
IMATH_NAME="v${IMATH_VERSION}.tar.gz"
IMATH_URL="https://github.com/AcademySoftwareFoundation/Imath/archive/refs/tags/${IMATH_NAME}"
DEPS_DIR="${DEPS}/Imath-${IMATH_VERSION}"
SYSROOT_IMATH="${SYSROOT}"

echo "=== Building Imath ${IMATH_VERSION} ==="

fetch_extract "${IMATH_URL}" "${IMATH_NAME}" "${DEPS}"

IMATH_BUILD="${DEPS}/build-Imath"
mkdir -p "${IMATH_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${IMATH_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_IMATH}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DIMATH_BUILD_TESTS=OFF \
    -DIMATH_BUILD_EXAMPLES=OFF

emcmake cmake --build "${IMATH_BUILD}" --target install -j "${NPROC}"

echo "Imath installed to ${SYSROOT_IMATH}"
