#!/bin/bash
# Audit the local Blender WASM artifact for obvious placeholder/fake output.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/public/wasm/blender"
ARTIFACT_DIR="$ROOT_DIR/artifacts/blender-wasm"
PUBLIC_JS="$PUBLIC_DIR/blender.js"
PUBLIC_WASM="$PUBLIC_DIR/blender.wasm"
ARTIFACT_JS="$ARTIFACT_DIR/blender.js"
ARTIFACT_WASM="$ARTIFACT_DIR/blender.wasm"
SMOKE_SOURCE="$ROOT_DIR/artifacts/smoke_test.c"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

warn() {
  echo "WARN: $*" >&2
}

pass() {
  echo "PASS: $*"
}

if [ -f "$SMOKE_SOURCE" ]; then
  if grep -q '4\.2\.0-emscripten\|bw_get_version_json\|bw_run_smoke_test' "$SMOKE_SOURCE"; then
    fail "$SMOKE_SOURCE contains hard-coded fake Blender smoke-test code. Remove it from the MVP path."
  fi
fi

if [ -f "$ARTIFACT_JS" ] || [ -f "$ARTIFACT_WASM" ]; then
  if [ ! -f "$ARTIFACT_JS" ] || [ ! -f "$ARTIFACT_WASM" ]; then
    fail "Incomplete build-output Blender artifact. Expected both $ARTIFACT_JS and $ARTIFACT_WASM, or neither."
  fi

  artifact_wasm_bytes="$(wc -c < "$ARTIFACT_WASM")"
  echo "Artifact WASM size: $artifact_wasm_bytes bytes"
  if [ "$artifact_wasm_bytes" -lt 1048576 ]; then
    fail "$ARTIFACT_WASM is under 1 MiB. Do not copy this into public/ as Blender output."
  fi
fi

if [ ! -f "$PUBLIC_JS" ] && [ ! -f "$PUBLIC_WASM" ]; then
  pass "No public Blender WASM artifact is installed. This is an honest pre-MVP baseline."
  exit 0
fi

if [ ! -f "$PUBLIC_JS" ] || [ ! -f "$PUBLIC_WASM" ]; then
  fail "Incomplete public Blender artifact. Expected both $PUBLIC_JS and $PUBLIC_WASM, or neither."
fi

public_wasm_bytes="$(wc -c < "$PUBLIC_WASM")"
public_js_bytes="$(wc -c < "$PUBLIC_JS")"

echo "Public JS size:   $public_js_bytes bytes"
echo "Public WASM size: $public_wasm_bytes bytes"

if [ "$public_wasm_bytes" -lt 1048576 ]; then
  fail "WASM is under 1 MiB. This is almost certainly not Blender-derived output."
fi

if ! grep -q 'CreateBlenderWasmModule' "$PUBLIC_JS"; then
  fail "$PUBLIC_JS does not expose CreateBlenderWasmModule. Rebuild with -sMODULARIZE=1 -sEXPORT_NAME=CreateBlenderWasmModule."
fi

if ! grep -q 'bw_get_version_json' "$PUBLIC_JS"; then
  fail "$PUBLIC_JS does not reference bw_get_version_json. Rebuild with the exported MVP bridge API."
fi

if ! grep -q 'bw_run_smoke_test' "$PUBLIC_JS"; then
  fail "$PUBLIC_JS does not reference bw_run_smoke_test. Rebuild with the exported MVP bridge API."
fi

if [ -f "$ARTIFACT_JS" ]; then
  if ! cmp -s "$ARTIFACT_JS" "$PUBLIC_JS"; then
    warn "public blender.js differs from artifacts blender.js. Document which one is authoritative."
  fi
fi

pass "Blender WASM artifact passes placeholder checks."
