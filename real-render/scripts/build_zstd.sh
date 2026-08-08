#!/usr/bin/env bash
# build_zstd.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

ZSTD_VERSION=1.5.6
ZSTD_NAME="zstd-${ZSTD_VERSION}.tar.gz"
ZSTD_URL="https://github.com/facebook/zstd/releases/download/v${ZSTD_VERSION}/${ZSTD_NAME}"
DEPS_DIR="${DEPS}/zstd-${ZSTD_VERSION}"
SYSROOT_ZSTD="${SYSROOT}"

echo "=== Building zstd ${ZSTD_VERSION} ==="

fetch_extract "${ZSTD_URL}" "${ZSTD_NAME}" "${DEPS}"

ZSTD_BUILD="${DEPS}/build-zstd"
mkdir -p "${ZSTD_BUILD}"

# Emscripten: build as a static library with position-independent code
emcmake cmake -S "${DEPS_DIR}" -B "${ZSTD_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_ZSTD}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DZSTD_BUILD_PROGRAMS=OFF \
    -DZSTD_BUILD_STATIC=ON \
    -DZSTD_BUILD_SHARED=OFF

emcmake cmake --build "${ZSTD_BUILD}" --target install -j "${NPROC}"

echo "zstd installed to ${SYSROOT_ZSTD}"
