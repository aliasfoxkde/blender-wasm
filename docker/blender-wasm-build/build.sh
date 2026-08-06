#!/bin/bash
# Blender WASM Build Script
# This script builds Blender for WebAssembly inside the Docker container
#
# NOTE: Blender's CMake build system has complex native library dependencies.
# Full cross-compilation requires either:
# 1. Using Emscripten ports for all dependencies
# 2. Patching Blender's CMake files
# 3. Using a native Linux x86_64 build environment
#
# This script demonstrates the proper setup but may require additional
# configuration for complete builds.

set -e

# Source Emscripten
source /emsdk/emsdk_env.sh

# Build configuration
BUILD_TYPE="${BUILD_TYPE:-Release}"
BUILD_DIR="${BUILD_DIR:-/build/build}"
BLENDER_SRC="${BLENDER_SRC:-/build/src}"
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
# - WITH_OPENSIMAGEIO=ON: Include OpenImageIO support (uses our stub)
# - WITH_CYCLES=OFF: Disable Cycles renderer (requires Embree)
# - WITH_GHOST_X11=OFF: Disable X11 windowing
# - WITH_GHOST_WAYLAND=OFF: Disable Wayland windowing
# - WITH_GHOST_SDL=OFF: Disable SDL windowing
# - WITH_PYTHON=OFF: Disable Python scripting for smaller build
# - WITH_LIBMV=OFF: Disable libmv (motion tracking)
# - WITH_DOCUMENTATION=OFF: Don't build docs
# - WITH_INSTALL=OFF: Skip installation step
# - WITH_TESTS=OFF: Skip test building
# - WITH_LIBS_PRECOMPILED=OFF: Don't use precompiled libraries
#
# IMPORTANT: For native library dependencies, Blender's CMake will try to find
# host libraries. For proper WASM builds, you may need to:
# 1. Use Emscripten ports: emcmake cmake ... -DEMCC_USE_PORT=libjpeg
# 2. Or provide stub libraries for CMake find modules

# Check for Emscripten ports (alternative approach)
# These would be passed as -sUSE_LIBJPEG=1 etc. at link time

emcmake cmake "$BLENDER_SRC" \
    -G Ninja \
    -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
    -DCMAKE_SYSROOT="/emsdk/upstream/emscripten/cache/sysroot" \
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
    -DWITH_LIBS_PRECOMPILED=OFF \
    -DWITH_VULKAN=OFF

echo "CMake configuration complete."
echo ""
echo "NOTE: If CMake configuration failed due to missing libraries,"
echo "you may need to either:"
echo "1. Install Emscripten ports (emcc --use-port=libjpeg, etc.)"
echo "2. Provide stub FindXXX.cmake modules"
echo "3. Use a native Linux build environment"
echo ""
echo "To build with Emscripten ports, add at link time:"
echo "  -sUSE_LIBJPEG=1 -sUSE_LIBPNG=1 -sUSE_ZLIB=1"
