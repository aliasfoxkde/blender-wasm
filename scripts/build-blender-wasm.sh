#!/bin/bash
# Build Blender for WebAssembly using Docker
#
# Usage:
#   ./scripts/build-blender-wasm.sh configure  # Run CMake configure only
#   ./scripts/build-blender-wasm.sh build     # Run configure + ninja build
#   ./scripts/build-blender-wasm.sh validate-source  # Build/link/run minimal source WASM proof
#   ./scripts/build-blender-wasm.sh shell     # Interactive shell in container
#   ./scripts/build-blender-wasm.sh clean     # Clean build artifacts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_ROOT/docker/blender-wasm-build"

# Artifact and log directories
ARTIFACTS_DIR="$PROJECT_ROOT/artifacts"
LOGS_DIR="$ARTIFACTS_DIR/logs"
BLENDER_WASM_DIR="$ARTIFACTS_DIR/blender-wasm"

mkdir -p "$LOGS_DIR" "$BLENDER_WASM_DIR"

cd "$DOCKER_DIR"

# Source Emscripten in container and run configure
run_configure() {
    echo "=========================================="
    echo "Configuring Blender WASM (CMake)..."
    echo "Log file: $LOGS_DIR/configure.log"
    echo "=========================================="

    docker compose run --rm blender-wasm-build bash -lc '
        set -euo pipefail
        mkdir -p /build-tools
        cp /blender-wasm/docker/blender-wasm-build/build.sh /build-tools/build.sh
        chmod +x /build-tools/build.sh
        exec /build-tools/build.sh configure
    ' 2>&1 | tee "$LOGS_DIR/configure.log"

    echo "Configure complete. Log: $LOGS_DIR/configure.log"
}

# Source Emscripten in container and run full build
run_build() {
    echo "=========================================="
    echo "Building Blender WASM..."
    echo "Log file: $LOGS_DIR/build.log"
    echo "=========================================="

    # Run configure first if not done
    if [ ! -f "$LOGS_DIR/configure.log" ]; then
        run_configure
    fi

    docker compose run --rm blender-wasm-build bash -lc '
        set -euo pipefail
        mkdir -p /build-tools
        cp /blender-wasm/docker/blender-wasm-build/build.sh /build-tools/build.sh
        chmod +x /build-tools/build.sh
        exec /build-tools/build.sh build
    ' 2>&1 | tee "$LOGS_DIR/build.log"

    # Copy artifacts to output directory
    echo "=========================================="
    echo "Copying artifacts to $BLENDER_WASM_DIR..."
    echo "=========================================="

    docker compose run --rm blender-wasm-build bash -c '
        if [ -d /build/build ]; then
            cp -r /build/build/lib/*.js /build/build/lib/*.wasm /artifacts/blender-wasm/ 2>/dev/null || true
            find /build/build -name "blender*.js" -o -name "blender*.wasm" 2>/dev/null | head -10
        fi
    ' 2>&1 | tee -a "$LOGS_DIR/build.log"

    echo "Build complete!"
    echo "Artifacts: $BLENDER_WASM_DIR"
    ls -la "$BLENDER_WASM_DIR/" 2>/dev/null || echo "No artifacts found yet"
}

# Build a minimal Blender WASM module linked against real Blender source libraries
run_minimal() {
    echo "=========================================="
    echo "Building minimal Blender WASM from real Blender source..."
    echo "Log file: $LOGS_DIR/minimal.log"
    echo "=========================================="

    docker compose run --rm blender-wasm-build bash -lc '
        set -euo pipefail
        mkdir -p /build-tools
        cp /blender-wasm/docker/blender-wasm-build/build.sh /build-tools/build.sh
        chmod +x /build-tools/build.sh
        exec /build-tools/build.sh minimal
    ' 2>&1 | tee "$LOGS_DIR/minimal.log"

    echo ""
    echo "=========================================="
    echo "Minimal build complete!"
    echo "=========================================="
    echo "WASM artifact: $PROJECT_ROOT/public/wasm/blender/"
    ls -la "$PROJECT_ROOT/public/wasm/blender/"
}

# Compile and execute a minimal WASM module linked against real Blender source libraries
run_validate_source() {
    echo "=========================================="
    echo "Validating Blender source WASM compilation..."
    echo "Log file: $LOGS_DIR/validate-source.log"
    echo "=========================================="

    docker compose run --rm blender-wasm-build bash -lc '
        set -euo pipefail
        mkdir -p /build-tools
        cp /blender-wasm/docker/blender-wasm-build/build.sh /build-tools/build.sh
        chmod +x /build-tools/build.sh
        exec /build-tools/build.sh validate-source
    ' 2>&1 | tee "$LOGS_DIR/validate-source.log"

    echo "Validation complete. Log: $LOGS_DIR/validate-source.log"
}

# Clean build artifacts
run_clean() {
    echo "Cleaning build artifacts..."
    docker compose down -v 2>/dev/null || true
    rm -rf "$PROJECT_ROOT/blender-wasm-cache" 2>/dev/null || true
    rm -rf "$LOGS_DIR" "$BLENDER_WASM_DIR" 2>/dev/null || true
    echo "Clean complete."
}

# Run interactive shell
run_shell() {
    docker compose run --rm blender-wasm-build bash
}

# Main
case "${1:-build}" in
    configure)
        run_configure
        ;;
    build)
        run_build
        ;;
    minimal)
        run_minimal
        ;;
    validate-source)
        run_validate_source
        ;;
    shell)
        run_shell
        ;;
    clean)
        run_clean
        ;;
    *)
        echo "Usage: $0 {configure|build|minimal|validate-source|shell|clean}"
        exit 1
        ;;
esac
