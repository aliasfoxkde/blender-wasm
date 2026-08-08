#!/usr/bin/env bash
# dep-common.sh
# Shared variables and functions for the dependency build.
# Source this before any per-dependency scripts.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load build config
source "${ROOT}/build.config.env"

# Derived paths
export EMSDK="${ROOT}/emsdk"
export SYSROOT="${ROOT}/wasm-sysroot"
export DEPS="${ROOT}/deps"
export NPROC="${BUILD_JOBS:-2}"

# ABI flags used for all WASM compilations
export WASM_CFLAGS="-O2 -pthread -msimd128 -fexceptions"
export WASM_CXXFLAGS="-O2 -pthread -msimd128 -fexceptions"

# Emscripten wrapper
export EM_BIN="${EMSDK}/upstream/bin"

# Activate emsdk env if available
if [ -f "${EMSDK}/emsdk_env.sh" ]; then
    source "${EMSDK}/emsdk_env.sh" 2>/dev/null || true
fi

# Ensure directories exist
mkdir -p "${DEPS}" "${SYSROOT}" "${SYSROOT}/lib" "${SYSROOT}/include"

# fetch_extract(url, archive_name, dest_dir)
# Downloads and extracts an archive if not already extracted.
fetch_extract() {
    local url="$1"
    local archive_name="$2"
    local dest_dir="$3"
    mkdir -p "${dest_dir}"

    if [ -f "${dest_dir}/.extracted" ]; then
        echo "Already extracted: ${archive_name} -> ${dest_dir}"
        return 0
    fi

    local cache="${DEPS}/${archive_name}"
    if [ ! -f "${cache}" ]; then
        echo "Downloading ${url} ..."
        curl -fsSL -o "${cache}" "${url}"
    else
        echo "Using cached: ${cache}"
    fi

    case "${archive_name}" in
        *.tar.gz|*.tgz)
            tar xzf "${cache}" -C "${dest_dir}" ;;
        *.tar.xz|*.txz)
            tar xJf "${cache}" -C "${dest_dir}" ;;
        *.tar.zst|*.tar.zst)
            if command -v zstd &> /dev/null; then
                zstd -dc "${cache}" | tar xf - -C "${dest_dir}"
            else
                echo "ERROR: zstd not found, cannot extract ${archive_name}" >&2
                return 1
            fi
            ;;
        *.zip)
            unzip -q "${cache}" -d "${dest_dir}" ;;
        *)
            echo "ERROR: unknown archive type: ${archive_name}" >&2
            return 1
            ;;
    esac

    touch "${dest_dir}/.extracted"
    echo "Extracted: ${archive_name} -> ${dest_dir}"
}

# em_cmake(source_dir, build_dir, install_prefix, extra_args...)
em_cmake() {
    local src="$1"
    local bld="$2"
    local prefix="$3"
    shift 3
    local extra="$@"

    mkdir -p "${bld}"
    emcmake cmake -S "${src}" -B "${bld}" \
        -DCMAKE_INSTALL_PREFIX="${prefix}" \
        -DCMAKE_BUILD_TYPE=Release \
        "${extra}"
}
