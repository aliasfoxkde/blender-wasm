#!/bin/bash
# Audit the blenlib WASM artifact for wasm32 validity.
# Verifies: archive existence, wasm magic bytes, Format: WASM, Arch: wasm32, AddressSize: 32bit

set -euo pipefail

BLENLIB_PATH="${BLENLIB_PATH:-/build/build/lib/libbf_blenlib.a}"
DNA_PATH="${DNA_PATH:-/build/build/lib/libbf_dna.a}"

if [ "${BLENDER_WASM_AUDIT_IN_DOCKER:-0}" != "1" ]; then
  PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  if [ ! -x /emsdk/upstream/emscripten/emar ] || [ ! -f "$BLENLIB_PATH" ] || [ ! -f "$DNA_PATH" ]; then
    if [ "${BLENDER_WASM_ALLOW_DOCKER:-0}" != "1" ]; then
      echo "SKIP: blenlib archive audit needs Emscripten tools and build archives." >&2
      echo "Set BLENDER_WASM_ALLOW_DOCKER=1 to run the Docker-backed audit explicitly." >&2
      exit 0
    fi
    echo "Running blenlib archive audit inside Docker..."
    cd "$PROJECT_ROOT/docker/blender-wasm-build"
    exec docker compose run --rm blender-wasm-build bash -lc '
      set -euo pipefail
      export BLENDER_WASM_AUDIT_IN_DOCKER=1
      source /emsdk/emsdk_env.sh >/dev/null
      exec bash /blender-wasm/scripts/audit-blenlib-artifact.sh
    '
  fi
fi

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

require_file() {
  local file="$1"
  local desc="$2"
  if [ ! -f "$file" ]; then
    fail "$desc not found: $file"
  fi
  echo "$desc exists: $file ($(wc -c < "$file") bytes)"
}

require_wasm_magic() {
  local wasm_file="$1"
  local header

  header="$(od -An -tx1 -N8 "$wasm_file" | tr -d ' \n')"
  if [ "$header" != "0061736d01000000" ]; then
    fail "$wasm_file is not a WebAssembly MVP binary. Header was: $header"
  fi
}

require_wasm_header() {
  local wasm_file="$1"
  local requirement="$2"

  if ! /emsdk/upstream/bin/llvm-readobj --file-headers "$wasm_file" 2>/dev/null | grep -q "$requirement"; then
    fail "$wasm_file does not contain required header: $requirement"
  fi
}

# Check archive exists
require_file "$BLENLIB_PATH" "blenlib archive"
require_file "$DNA_PATH" "DNA archive"

# Extract first member from archive
first_member="$(/emsdk/upstream/emscripten/emar t "$BLENLIB_PATH" | head -1)"
if [ -z "$first_member" ]; then
  fail "libbf_blenlib.a is empty or corrupt"
fi
echo "First member: $first_member"

# Create temp dir and extract
tmp_dir="$(mktemp -d)"
trap "rm -rf $tmp_dir" EXIT
cp "$BLENLIB_PATH" "$tmp_dir/"
cd "$tmp_dir"
/emsdk/upstream/emscripten/emar x libbf_blenlib.a "$first_member"

# Verify wasm magic
require_wasm_magic "$first_member"

# Verify wasm format
require_wasm_header "$first_member" "Format: WASM"

# Verify wasm32 architecture
require_wasm_header "$first_member" "Arch: wasm32"

# Verify 32-bit address size
require_wasm_header "$first_member" "AddressSize: 32bit"

# Report size info
blenlib_size="$(wc -c < "$BLENLIB_PATH")"
dna_size="$(wc -c < "$DNA_PATH")"
echo ""
echo "blenlib archive: $blenlib_size bytes ($(numfmt --to=iec $blenlib_size))"
echo "DNA archive:     $dna_size bytes ($(numfmt --to=iec $dna_size))"

if [ "$blenlib_size" -lt 1048576 ]; then
  warn "blenlib archive is below 1 MiB. Expected ~2.6 MB for full blenlib."
fi

pass "blenlib artifact is valid wasm32"
exit 0
