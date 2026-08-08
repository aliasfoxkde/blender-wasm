#!/usr/bin/env bash
# build_jpeg.sh  — libjpeg-turbo
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/dep-common.sh"

JPEG_VERSION=2.1.5.7
JPEG_NAME="libjpeg-turbo-${JPEG_VERSION}.tar.gz"
JPEG_URL="https://sourceforge.net/projects/libjpeg-turbo/files/${JPEG_VERSION}/${JPEG_NAME}/download"
DEPS_DIR="${DEPS}/libjpeg-turbo-${JPEG_VERSION}"
SYSROOT_JPEG="${SYSROOT}"

echo "=== Building libjpeg-turbo ${JPEG_VERSION} ==="

fetch_extract "${JPEG_URL}" "${JPEG_NAME}" "${DEPS}"

JPEG_BUILD="${DEPS}/build-jpeg"
mkdir -p "${JPEG_BUILD}"

emcmake cmake -S "${DEPS_DIR}" -B "${JPEG_BUILD}" \
    -DCMAKE_INSTALL_PREFIX="${SYSROOT_JPEG}" \
    -DCMAKE_BUILD_TYPE=Release \
    -DENABLE_SHARED=OFF \
    -DENABLE_STATIC=ON

emcmake cmake --build "${JPEG_BUILD}" --target install -j "${NPROC}"

echo "libjpeg-turbo installed to ${SYSROOT_JPEG}"
