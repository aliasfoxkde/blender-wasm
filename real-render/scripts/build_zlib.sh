#!/usr/bin/env bash
# build_zlib.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

ZLIB_VERSION=1.3.1
ZLIB_NAME="zlib-${ZLIB_VERSION}.tar.gz"
ZLIB_URL="https://zlib.net/${ZLIB_NAME}"
DEPS_DIR="${DEPS}/zlib-${ZLIB_VERSION}"
SYSROOT_ZLIB="${SYSROOT}"

echo "=== Building zlib ${ZLIB_VERSION} ==="

fetch_extract "${ZLIB_URL}" "${ZLIB_NAME}" "${DEPS}"

ZLIB_BUILD="${DEPS}/build-zlib"
mkdir -p "${ZLIB_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${ZLIB_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_ZLIB}" \
    -DCMAKE_BUILD_TYPE=Release

emcmake cmake --build "${ZLIB_BUILD}" --target install -j "${NPROC}"

echo "zlib installed to ${SYSROOT_ZLIB}"
