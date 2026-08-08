#!/usr/bin/env bash
# build_fmt.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

FMT_VERSION=11.0.2
FMT_NAME="fmt-${FMT_VERSION}.tar.gz"
FMT_URL="https://github.com/fmtlib/fmt/releases/download/${FMT_VERSION}/${FMT_NAME}"
DEPS_DIR="${DEPS}/fmt-${FMT_VERSION}"
SYSROOT_FMT="${SYSROOT}"

echo "=== Building fmt ${FMT_VERSION} ==="

fetch_extract "${FMT_URL}" "${FMT_NAME}" "${DEPS}"

FMT_BUILD="${DEPS}/build-fmt"
mkdir -p "${FMT_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${FMT_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_FMT}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DFMT_TEST=OFF \
    -DFMT_DOC=OFF

emcmake cmake --build "${FMT_BUILD}" --target install -j "${NPROC}"

echo "fmt installed to ${SYSROOT_FMT}"
