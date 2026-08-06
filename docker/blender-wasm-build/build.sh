#!/bin/bash
# Blender WASM Build Script
# This script builds Blender for WebAssembly inside the Docker container

set -e

# Source Emscripten
source /emsdk/emsdk_env.sh

# Build configuration
BUILD_TYPE="${BUILD_TYPE:-Release}"
BUILD_DIR="${BUILD_DIR:-/blender-build/build}"
BLENDER_SRC="${BLENDER_SRC:-/blender-build/src}"
OPENIMAGEIO_ROOT="${OPENIMAGEIO_ROOT:-/openimageio-stub}"

echo "=========================================="
echo "Blender WASM Build Configuration"
echo "=========================================="
echo "Build Type: $BUILD_TYPE"
echo "Build Dir: $BUILD_DIR"
echo "Blender Src: $BLENDER_SRC"
echo "OpenImageIO: $OPENIMAGEIO_ROOT"
echo "=========================================="

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure CMake
# Key options for WASM build:
# - WITH_OPENSIMAGEIO=ON: Include OpenImageIO support
# - WITH_CYCLES=OFF: Disable Cycles renderer (requires Embree)
# - WITH_GHOST_X11=OFF: Disable X11 windowing
# - WITH_GHOST_WAYLAND=OFF: Disable Wayland windowing
# - WITH_GHOST_SDL=OFF: Disable SDL windowing
# - WITH_PYTHON=OFF: Disable Python scripting for smaller build
# - WITH_LIBMV=OFF: Disable libmv (motion tracking)
# - WITH_DOCUMENTATION=OFF: Don't build docs
# - WITH_INSTALL=OFF: Skip installation step
# - WITH_TESTS=OFF: Skip test building

emcmake cmake "$BLENDER_SRC" \
    -G Ninja \
    -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
    -DWITH_OPENSIMAGEIO=ON \
    -DOPENIMAGEIO_ROOT="$OPENIMAGEIO_ROOT" \
    -DWITH_CYCLES=OFF \
    -DWITH_CYCLES_EMBREE=OFF \
    -DWITH_CYCLES_OSL=OFF \
    -DWITH_GHOST_X11=OFF \
    -DWITH_GHOST_WAYLAND=OFF \
    -DWITH_GHOST_SDL=OFF \
    -DWITH_PYTHON=OFF \
    -DWITH_LIBMV=OFF \
    -DWITH_DOCUMENTATION=OFF \
    -DWITH_INSTALL=OFF \
    -DWITH_TESTS=OFF \
    -DWITH_JACK=OFF \
    -DWITH_PULSEAUDIO=OFF \
    -DWITH_PIPEWIRE=OFF \
    -DWITH_GHOST_NATIVE=OFF

# Build with all available cores
ninja -j$(nproc)

echo "=========================================="
echo "Build complete!"
echo "=========================================="
echo "Output files:"
find "$BUILD_DIR" -name "*.wasm" -o -name "*.js" 2>/dev/null | head -20
