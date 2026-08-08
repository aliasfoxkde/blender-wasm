#!/bin/bash
# Audit script to distinguish between different Blender WASM baselines.
# This helps determine which baseline is deployed and what capabilities it has.

set -euo pipefail

ARTIFACTS=(
    "/wasm/blender/blender.wasm"           # minimal baseline
    "/artifacts/blender-wasm/blender.wasm"  # from build
    "/artifacts/blender-wasm/blender_blenlib.wasm"  # experimental blenlib
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_baseline() {
    local name="$1"
    local version="$2"
    local size="$3"
    local libs="$4"
    local status="$5"

    echo ""
    echo "=========================================="
    echo "Baseline: $name"
    echo "=========================================="
    echo "Version:    $version"
    echo "Size:       $size"
    echo "Libraries:   $libs"
    echo "Status:     $status"
    echo "=========================================="
}

audit_wasm() {
    local wasm_file="$1"
    local label="$2"

    if [ ! -f "$wasm_file" ]; then
        echo -e "${YELLOW}SKIP${NC}: $label not found at $wasm_file"
        return 1
    fi

    echo -e "${GREEN}FOUND${NC}: $label at $wasm_file"
    local size=$(wc -c < "$wasm_file")
    echo "Size: $size bytes ($(numfmt --to=iec $size))"

    # Check for baseline markers
    local has_minimal=false
    local has_blenlib=false
    local has_dna=false

    if grep -q "bw_get_version_json\|CLG_init\|CLG_exit" "$wasm_file" 2>/dev/null; then
        has_minimal=true
        echo -e "  ${GREEN}+${NC} Has minimal baseline markers (CLG_*)"
    fi

    if grep -q "bw_blenlib_\|BLI_hash_mm2a\|BLI_strlen" "$wasm_file" 2>/dev/null; then
        has_blenlib=true
        echo -e "  ${GREEN}+${NC} Has blenlib markers (bw_blenlib_*, BLI_*)"
    fi

    if grep -q "DNA_\|dna_\|bf_dna" "$wasm_file" 2>/dev/null; then
        has_dna=true
        echo -e "  ${GREEN}+${NC} Has DNA markers"
    fi

    # Prefer explicit markers over size. The experimental blenlib bridge is
    # intentionally smaller than the minimal LINKABLE proof because it exports
    # only the bridge API and lets wasm-ld eliminate unused archive members.
    if [ "$has_blenlib" = true ]; then
        print_baseline "BLENLIB" "4.2.0-wasm" "$size" "clog, guardedalloc, blenlib, DNA" "Experimental"
    elif [ "$has_minimal" = true ]; then
        print_baseline "MINIMAL" "4.2.0-wasm" "$size" "clog, guardedalloc" "Baseline"
    elif [ "$size" -lt 2000000 ]; then
        print_baseline "MINIMAL+" "4.2.0-wasm" "$size" "unknown small artifact" "Needs verification"
    else
        print_baseline "FULL?" "4.2.0-wasm" "$size" "Multiple libraries" "Needs verification"
    fi

    return 0
}

echo "Blender WASM Baseline Audit"
echo "=========================="

found=0

# Try to find baselines in common locations
for artifact in "${ARTIFACTS[@]}"; do
    if [ -f "$artifact" ]; then
        if audit_wasm "$artifact" "$(basename $(dirname $artifact))/$(basename $artifact)"; then
            found=$((found + 1))
        fi
    fi
done

# Also check relative to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for subpath in "public/wasm/blender/blender.wasm" "artifacts/blender-wasm/blender.wasm" "artifacts/blender-wasm/blender_blenlib.wasm"; do
    fullpath="$PROJECT_ROOT/$subpath"
    if [ -f "$fullpath" ]; then
        if audit_wasm "$fullpath" "$subpath"; then
            found=$((found + 1))
        fi
    fi
done

if [ "$found" -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}WARNING${NC}: No Blender WASM artifacts found."
    echo "Available baselines:"
    echo "  - minimal (clog + guardedalloc)"
    echo "  - blenlib (clog + guardedalloc + blenlib + DNA) [experimental]"
    echo ""
    echo "To build experimental blenlib module:"
    echo "  ./scripts/build-blender-wasm.sh blenlib-module"
fi

echo ""
echo "Audit complete. Found $found baseline(s)."
exit 0
