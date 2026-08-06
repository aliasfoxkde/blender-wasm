#!/bin/bash
# Build Blender for WebAssembly using Docker
#
# Usage:
#   ./scripts/build-blender-wasm.sh          # Interactive shell in container
#   ./scripts/build-blender-wasm.sh build   # Run full build
#   ./scripts/build-blender-wasm.sh clean   # Clean build artifacts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_ROOT/docker/blender-wasm-build"

cd "$DOCKER_DIR"

# Source Emscripten in container and run build
run_build() {
    echo "=========================================="
    echo "Building Blender WASM..."
    echo "=========================================="

    docker compose run --rm blender-wasm-build bash -c '
        set -e
        source /emsdk/emsdk_env.sh 2>/dev/null || true

        BUILD_DIR=/build/build
        BLENDER_SRC=/build/src
        OPENIMAGEIO_ROOT=/openimageio-stub

        mkdir -p "$BUILD_DIR"
        cd "$BUILD_DIR"

        echo "Configuring CMake..."
        emcmake cmake "$BLENDER_SRC" \
            -G Ninja \
            -DCMAKE_BUILD_TYPE=Release \
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
            -DWITH_PIPEWIRE=OFF

        echo "Building with Ninja..."
        ninja -j$(nproc)

        echo "=========================================="
        echo "Build complete!"
        echo "=========================================="
        find "$BUILD_DIR" -name "*.wasm" -o -name "*.js" 2>/dev/null | head -20
    '
}

# Clean build artifacts
run_clean() {
    echo "Cleaning build artifacts..."
    docker compose down -v 2>/dev/null || true
    rm -rf "$DOCKER_DIR/../blender-wasm-cache" 2>/dev/null || true
    echo "Clean complete."
}

# Run interactive shell
run_shell() {
    docker compose run --rm blender-wasm-build bash
}

# Main
case "${1:-build}" in
    build)
        run_build
        ;;
    shell)
        run_shell
        ;;
    clean)
        run_clean
        ;;
    *)
        echo "Usage: $0 {build|shell|clean}"
        exit 1
        ;;
esac
