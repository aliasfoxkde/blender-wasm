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

require_wasm_magic() {
  local wasm_file="$1"
  local header

  header="$(od -An -tx1 -N8 "$wasm_file" | tr -d ' \n')"
  if [ "$header" != "0061736d01000000" ]; then
    fail "$wasm_file is not a WebAssembly MVP binary. Header was: $header"
  fi
}

require_js_marker() {
  local js_file="$1"
  local marker="$2"

  if ! grep -q "$marker" "$js_file"; then
    fail "$js_file does not reference $marker."
  fi
}

require_wasm_symbol() {
  local wasm_file="$1"
  local symbol="$2"

  if ! grep -a -q "$symbol" "$wasm_file"; then
    fail "$wasm_file does not contain expected Blender/WASM symbol: $symbol"
  fi
}

audit_artifact_pair() {
  local label="$1"
  local js_file="$2"
  local wasm_file="$3"
  local wasm_bytes
  local js_bytes

  if [ ! -f "$js_file" ] && [ ! -f "$wasm_file" ]; then
    return 1
  fi

  if [ ! -f "$js_file" ] || [ ! -f "$wasm_file" ]; then
    fail "Incomplete $label Blender artifact. Expected both $js_file and $wasm_file, or neither."
  fi

  wasm_bytes="$(wc -c < "$wasm_file")"
  js_bytes="$(wc -c < "$js_file")"

  echo "$label JS size:   $js_bytes bytes"
  echo "$label WASM size: $wasm_bytes bytes"

  if [ "$wasm_bytes" -lt 32768 ]; then
    fail "$wasm_file is too small to be the validated minimal Blender baseline."
  fi

  if [ "$wasm_bytes" -lt 1048576 ]; then
    warn "$wasm_file is below 1 MiB. Treating it as the minimal clog/guardedalloc baseline, not full Blender."
  fi

  require_wasm_magic "$wasm_file"
  require_js_marker "$js_file" 'CreateBlenderWasmModule'
  require_js_marker "$js_file" 'bw_get_version_json'
  require_js_marker "$js_file" 'bw_run_smoke_test'

  require_wasm_symbol "$wasm_file" 'bw_get_version_json'
  require_wasm_symbol "$wasm_file" 'bw_run_smoke_test'
  require_wasm_symbol "$wasm_file" 'CLG_init'
  require_wasm_symbol "$wasm_file" 'CLG_exit'
  require_wasm_symbol "$wasm_file" 'CLG_level_set'
  require_wasm_symbol "$wasm_file" 'MEM_mallocN'
  require_wasm_symbol "$wasm_file" 'MEM_freeN'

  return 0
}

if [ -f "$SMOKE_SOURCE" ]; then
  if grep -q '4\.2\.0-emscripten\|bw_get_version_json\|bw_run_smoke_test' "$SMOKE_SOURCE"; then
    fail "$SMOKE_SOURCE contains hard-coded fake Blender smoke-test code. Remove it from the MVP path."
  fi
fi

artifact_present=0
public_present=0

if audit_artifact_pair "Artifact" "$ARTIFACT_JS" "$ARTIFACT_WASM"; then
  artifact_present=1
fi

if [ ! -f "$PUBLIC_JS" ] && [ ! -f "$PUBLIC_WASM" ]; then
  if [ "$artifact_present" -eq 1 ]; then
    pass "Build-output Blender WASM artifact passes minimal baseline checks."
    exit 0
  fi

  pass "No public Blender WASM artifact is installed. This is an honest pre-MVP baseline."
  exit 0
fi

if audit_artifact_pair "Public" "$PUBLIC_JS" "$PUBLIC_WASM"; then
  public_present=1
fi

if [ -f "$ARTIFACT_JS" ]; then
  if ! cmp -s "$ARTIFACT_JS" "$PUBLIC_JS"; then
    warn "public blender.js differs from artifacts blender.js. Document which one is authoritative."
  fi
fi

if [ "$public_present" -eq 1 ]; then
  pass "Blender WASM artifact passes minimal baseline checks."
fi
