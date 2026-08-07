#!/bin/bash
# Blender WASM Build Script
# Uses stub find modules for cross-compilation to WebAssembly
#
# The stubs provide empty libraries during CMake config phase.
# Emscripten ports provide the actual WASM libraries at link time via -sUSE_* flags.

set -e

# Source Emscripten
source /emsdk/emsdk_env.sh

# Build configuration
BUILD_TYPE="${BUILD_TYPE:-Release}"
BUILD_DIR="${BUILD_DIR:-/build/build}"
BLENDER_SRC="${BLENDER_SRC:-/build/src}"
OPENIMAGEIO_ROOT="${OPENIMAGEIO_ROOT:-/openimageio-stub}"
STUB_DIR="${STUB_DIR:-/cmake-stubs}"

echo "=========================================="
echo "Blender WASM Build"
echo "=========================================="
echo "Build Type: $BUILD_TYPE"
echo "Build Dir: $BUILD_DIR"
echo "Blender Src: $BLENDER_SRC"
echo "OpenImageIO: $OPENIMAGEIO_ROOT"
echo "Stub Modules: $STUB_DIR"
echo "=========================================="

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Configure CMake with stub modules
# CMAKE_MODULE_PATH points to our stub find modules first
# This tells Blender's CMake to use our stubs instead of looking for system libraries

emcmake cmake "$BLENDER_SRC" \
    -G Ninja \
    -DCMAKE_BUILD_TYPE="$BUILD_TYPE" \
    -DCMAKE_MODULE_PATH="$STUB_DIR;${CMAKE_MODULE_PATH}" \
    -DCMAKE_SYSROOT="/emsdk/upstream/emscripten/cache/sysroot" \
    -DWITH_OPENIMAGEIO=ON \
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
    -DWITH_VULKAN=OFF \
    -DWITH_GHOST_NATIVE=OFF

echo ""
echo "=========================================="
echo "CMake configuration complete!"
echo "=========================================="
echo ""
echo "To build: ninja -j\$(nproc)"
echo ""
echo "Note: Link with Emscripten ports for actual libraries:"
echo "  -sUSE_LIBJPEG=1 -sUSE_LIBPNG=1 -sUSE_ZLIB=1"
