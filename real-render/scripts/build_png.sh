#!/usr/bin/env bash
# build_png.sh  — libpng
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

PNG_VERSION=1.6.43
PNG_NAME="libpng-${PNG_VERSION}.tar.xz"
PNG_URL="https://sourceforge.net/projects/libpng/files/libpng16/${PNG_VERSION}/${PNG_NAME}/download"
DEPS_DIR="${DEPS}/libpng-${PNG_VERSION}"
SYSROOT_PNG="${SYSROOT}"

echo "=== Building libpng ${PNG_VERSION} ==="

fetch_extract "${PNG_URL}" "${PNG_NAME}" "${DEPS}"

PNG_BUILD="${DEPS}/build-png"
mkdir -p "${PNG_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${PNG_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_PNG}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DPNG_SHARED=OFF \
    -DPNG_STATIC=ON \
    -DPNG_TESTS=OFF

emcmake cmake --build "${PNG_BUILD}" --target install -j "${NPROC}"

echo "libpng installed to ${SYSROOT_PNG}"
