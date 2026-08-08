#!/usr/bin/env bash
# build-deps-minimal.sh
# Builds the minimal dependency sysroot for Cycles standalone WASM.
# Order matters — later deps may depend on earlier ones.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${ROOT}/build.config.env"

echo "=========================================="
echo "Building minimal dependency sysroot"
echo "BUILD_JOBS=${BUILD_JOBS:-2}"
echo "=========================================="

# Source the common env to get EM_BIN etc.
source "${SCRIPT_DIR}/dep-common.sh"

echo ""
echo "--- (1/8) zlib ---"
bash "${SCRIPT_DIR}/build_zlib.sh"

echo ""
echo "--- (2/8) fmt ---"
bash "${SCRIPT_DIR}/build_fmt.sh"

echo ""
echo "--- (3/8) Imath ---"
bash "${SCRIPT_DIR}/build_imath.sh"

echo ""
echo "--- (4/8) zstd ---"
bash "${SCRIPT_DIR}/build_zstd.sh"

echo ""
echo "--- (5/8) libjpeg-turbo ---"
bash "${SCRIPT_DIR}/build_jpeg.sh"

echo ""
echo "--- (6/8) libpng ---"
bash "${SCRIPT_DIR}/build_png.sh"

echo ""
echo "--- (7/8) oneTBB ---"
bash "${SCRIPT_DIR}/build_tbb.sh"

echo ""
echo "--- (8/8) pugixml ---"
bash "${SCRIPT_DIR}/build_pugixml.sh"

echo ""
echo "=========================================="
echo "All dependencies installed to ${SYSROOT}"
echo "=========================================="
