#!/usr/bin/env bash
# setup-toolchain.sh
# Clones emsdk and activates the pinned Emscripten version.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/../build.config.env"

EMSDK_DIR="${ROOT}/emsdk"

if [ ! -d "${EMSDK_DIR}" ]; then
    echo "Cloning emsdk..."
    git clone --depth=1 https://github.com/emscripten-core/emsdk.git "${EMSDK_DIR}"
fi

cd "${EMSDK_DIR}"

echo "Installing and activating Emscripten ${EMSDK_VERSION}..."
./emsdk install "${EMSDK_VERSION}"
./emsdk activate "${EMSDK_VERSION}"

# Verify emcc is available
source ./emsdk_env.sh
EMCC_VERSION="$(emcc --version)"
echo "emcc --version: ${EMCC_VERSION}"

if ! command -v emcc &> /dev/null; then
    echo "ERROR: emcc not found after activation" >&2
    exit 1
fi

echo "Toolchain ready."
