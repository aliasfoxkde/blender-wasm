#!/usr/bin/env bash
# link-cycles-web.sh
# Relinks CMake's Cycles output for the browser with browser-specific flags.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${ROOT}/build.config.env"
source "${SCRIPT_DIR}/dep-common.sh"

BUILD_DIR="${ROOT}/build-cycles"
WEB_DIR="${ROOT}/web"
SCENES_DIR="${WEB_DIR}/scenes"
mkdir -p "${WEB_DIR}" "${SCENES_DIR}"

if [ ! -f "${BUILD_DIR}/bin/cycles.js" ]; then
    echo "ERROR: cycles.js not found in ${BUILD_DIR}/bin/" >&2
    echo "Run build-cycles.sh first." >&2
    exit 1
fi

echo "=== Relinking Cycles for browser ==="

# The JS glue from CMake already exists — we just need to re-link with browser flags.
# Emscripten uses the JS file as both glue AND linker driver.
# We invoke emcc in link mode on the same JS with extra browser flags.

EMCC="${EMSDK}/upstream/bin/emcc"

# Read the original link command (it wraps the JS + WASM)
# For Emscripten, re-linking means running emcc on the existing JS with extra flags.
# The JS file itself was already compiled; we add browser runtime flags here.

BROWSER_FLAGS=(
    -pthread
    -sPROXY_TO_PTHREAD
    -sEXIT_RUNTIME=0
    -sALLOW_MEMORY_GROWTH=1
    -sINITIAL_MEMORY=536870912
    -sMAXIMUM_MEMORY=2147483648
    -sSTACK_SIZE=8388608
    -sDEFAULT_PTHREAD_STACK_SIZE=8388608
    -sPTHREAD_POOL_SIZE=navigator.hardwareConcurrency
    -sPTHREAD_POOL_SIZE_STRICT=0
    -sWASMFS
    -sFORCE_FILESYSTEM=1
    -sEXPORTED_RUNTIME_METHODS=FS,callMain,ccall,cwrap
    -sENVIRONMENT=web,worker
    -sASSERTIONS=2
)

# Produce: real-render.js → real-render.wasm
OUTPUT_JS="${WEB_DIR}/real-render.js"
OUTPUT_WASM="${WEB_DIR}/real-render.wasm"

echo "Linking with browser flags..."
echo "Output: ${OUTPUT_JS}"

"${EMCC}" \
    "${BUILD_DIR}/bin/cycles.js" \
    "${BROWSER_FLAGS[@]}" \
    -o "${OUTPUT_JS}" \
    2>&1

echo ""
echo "=== Artifact sizes ==="
for f in "${OUTPUT_JS}" "${OUTPUT_WASM}"; do
    if [ -f "${f}" ]; then
        echo "$(basename $f): $(wc -c < "$f") bytes"
    else
        echo "$(basename $f): NOT FOUND"
    fi
done

# Create a minimal sample scene for preloading
# This is a placeholder — the actual scene will be defined during integration
if [ ! -f "${SCENES_DIR}/scene.xml" ]; then
    cat > "${SCENES_DIR}/scene.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!-- Placeholder scene — real scene assets produced by build process -->
<scene>
  <camera type="perspective" fov="50"/>
  <ambient/>
</scene>
EOF
    echo "Created placeholder scene at ${SCENES_DIR}/scene.xml"
fi

echo ""
echo "Browser relink complete."
echo "Artifacts:"
echo "  ${OUTPUT_JS}"
echo "  ${OUTPUT_WASM}"
