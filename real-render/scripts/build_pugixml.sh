#!/usr/bin/env bash
# build_pugixml.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

PUGIXML_VERSION=1.15
PUGIXML_NAME="pugixml-${PUGIXML_VERSION}.tar.gz"
PUGIXML_URL="https://github.com/zeux/pugixml/releases/download/v${PUGIXML_VERSION}/${PUGIXML_NAME}"
DEPS_DIR="${DEPS}/pugixml-${PUGIXML_VERSION}"
SYSROOT_PUGI="${SYSROOT}"

echo "=== Building pugixml ${PUGIXML_VERSION} ==="

fetch_extract "${PUGIXML_URL}" "${PUGIXML_NAME}" "${DEPS}"

PUGI_BUILD="${DEPS}/build-pugixml"
mkdir -p "${PUGI_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${PUGI_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_PUGI}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DPUGIXML_BUILD_TESTS=OFF \
    -DPUGIXML_BUILD_SAMPLES=OFF

emcmake cmake --build "${PUGI_BUILD}" --target install -j "${NPROC}"

echo "pugixml installed to ${SYSROOT_PUGI}"
