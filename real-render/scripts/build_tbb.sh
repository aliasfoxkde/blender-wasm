#!/usr/bin/env bash
# build_tbb.sh  — oneTBB
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

TBB_VERSION=2021.13.0
TBB_NAME="oneTBB-${TBB_VERSION}.tar.gz"
TBB_URL="https://github.com/oneapi-src/oneTBB/releases/download/v${TBB_VERSION}/${TBB_NAME}"
DEPS_DIR="${DEPS}/oneTBB-${TBB_VERSION}"
SYSROOT_TBB="${SYSROOT}"

echo "=== Building oneTBB ${TBB_VERSION} ==="

fetch_extract "${TBB_URL}" "${TBB_NAME}" "${DEPS}"

TBB_BUILD="${DEPS}/build-tbb"
mkdir -p "${TBB_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${TBB_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_TBB}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DTBB_TEST=OFF \
    -DTBB_EXAMPLES=OFF

emcmake cmake --build "${TBB_BUILD}" --target install -j "${NPROC}"

echo "oneTBB installed to ${SYSROOT_TBB}"
