#!/usr/bin/env bash
# build-cycles.sh
# Compiles the Cycles standalone WASM target.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${ROOT}/build.config.env"
source "${SCRIPT_DIR}/dep-common.sh"

BUILD_DIR="${ROOT}/build-cycles"
LOG_DIR="${ROOT}/artifacts/logs"
mkdir -p "${LOG_DIR}"

if [ ! -d "${BUILD_DIR}" ]; then
    echo "ERROR: build directory not found: ${BUILD_DIR}" >&2
    echo "Run configure-cycles.sh first." >&2
    exit 1
fi

echo "=========================================="
echo "Building Cycles standalone"
echo "BUILD_JOBS=${BUILD_JOBS:-2}"
echo "=========================================="

LOG="${LOG_DIR}/real-render-build-cycles.log"
mkdir -p "$(dirname "${LOG}")"

ninja -C "${BUILD_DIR}" -j "${BUILD_JOBS:-2}" cycles 2>&1 | tee "${LOG}"
BUILD_STATUS=${PIPESTATUS[0]}

if [ ${BUILD_STATUS} -ne 0 ]; then
    echo ""
    echo "ERROR: Cycles build failed. First error is in ${LOG}"
    echo ""
    # Create a build note for the failure
    NOTE="${ROOT}/docs/build-notes/cycles-build-failure-$(date +%Y%m%d-%H%M%S).md"
    mkdir -p "$(dirname "${NOTE}")"
    cat > "${NOTE}" <<EOF
# Cycles Build Failure

Date: $(date -Iseconds)
Command: ninja -C ${BUILD_DIR} -j ${BUILD_JOBS:-2} cycles
Log: ${LOG}

First few lines of failure (from log):

$(head -50 "${LOG}")

## Recommended next action

Review the CMake configure step first. If configure succeeded,
the failure is in compilation — check the first error message above.
EOF
    echo "Build note created at: ${NOTE}"
    exit 1
fi

# Report artifact sizes
echo ""
echo "=== Artifact sizes ==="
CYCLES_JS="${BUILD_DIR}/bin/cycles.js"
CYCLES_WASM="${BUILD_DIR}/bin/cycles.wasm"

if [ -f "${CYCLES_JS}" ]; then
    SIZE_JS=$(wc -c < "${CYCLES_JS}")
    echo "cycles.js     : ${SIZE_JS} bytes"
else
    echo "cycles.js     : NOT FOUND"
fi

if [ -f "${CYCLES_WASM}" ]; then
    SIZE_WASM=$(wc -c < "${CYCLES_WASM}")
    echo "cycles.wasm   : ${SIZE_WASM} bytes"
else
    echo "cycles.wasm   : NOT FOUND (may be embedded in cycles.js)"
fi

echo ""
echo "Build complete. Artifact sizes recorded above."
