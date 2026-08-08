# Building Blender for WebAssembly

This document describes how to build Blender as a WebAssembly module for the blender-wasm project.

## Reality Check

The current checked-in browser artifacts are not full Blender. They are:

- a minimal bridge linked to real Blender `clog` and `guardedalloc`;
- an experimental blenlib bridge linked to real `bf_blenlib` and `bf_dna`.

Native Blender scene rendering is not available in the current app. Do not use
this build path to claim full Blender rendering until a browser test proves real
Blender/Cycles pixels are produced by WASM.

For the next production build direction, use
[`REAL_BLENDER_WASM_RECOVERY_PLAN_2026-08-08.md`](REAL_BLENDER_WASM_RECOVERY_PLAN_2026-08-08.md).

## Prerequisites

- Docker
- docker-compose
- ~20GB disk space for the current minimal/blenlib build environment
- much more disk/RAM for full Blender or Cycles builds

## Local Resource Limits

Do not run unconstrained Docker builds on a normal workstation. The wrapper now
defaults to conservative limits:

```bash
BUILD_JOBS=2
BLENDER_WASM_DOCKER_CPUS=2
BLENDER_WASM_DOCKER_MEMORY=8g
```

Override those only on a machine that can absorb the load:

```bash
BUILD_JOBS=4 BLENDER_WASM_DOCKER_CPUS=4 BLENDER_WASM_DOCKER_MEMORY=16g ./scripts/build-blender-wasm.sh blenlib-module
```

Full Blender/Cycles production builds should run in CI or on a self-hosted
builder with explicit CPU, memory, swap, and disk budgets.

## Quick Start

### 1. Build the Docker Image

```bash
cd docker/blender-wasm-build
docker compose build
```

This builds the Emscripten-based build environment with all dependencies.

### 2. Run the Build

```bash
# Interactive build (opens shell in container)
./scripts/build-blender-wasm.sh shell

# Inside the container, run:
./build.sh

# Or run build directly
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g ./scripts/build-blender-wasm.sh build
```

### 3. Locate Output

After successful build, WASM files are at:
```
docker/blender-wasm-build/build/bin/
```

## The Build Process

### Stage 1: Docker Image
The Dockerfile sets up:
1. Emscripten SDK 3.1.70
2. Build tools (cmake, ninja, python)
3. Blender source (blender-v4.2-release branch)
4. OpenImageIO stub library

### Stage 2: CMake Configuration
```bash
emcmake cmake $BLENDER_SRC \
    -DWITH_OPENSIMAGEIO=ON \
    -DOPENIMAGEIO_ROOT="$OPENIMAGEIO_ROOT" \
    -DWITH_CYCLES=OFF \
    -DWITH_GHOST_X11=OFF \
    -DWITH_GHOST_WAYLAND=OFF \
    -DWITH_GHOST_SDL=OFF \
    -DWITH_PYTHON=OFF \
    ...
```

### Stage 3: Ninja Build
```bash
ninja -j$(nproc)
```

## Build Options

### Core Options
| Option | Default | Description |
|--------|---------|-------------|
| `CMAKE_BUILD_TYPE` | Release | Release/Debug |
| `WITH_OPENSIMAGEIO` | ON | OpenImageIO support |
| `WITH_PYTHON` | OFF | Python scripting |

### Disabled Features
These are disabled to reduce complexity:
- Cycles renderer (requires Embree)
- X11/Wayland GUI (headless)
- Python scripting
- libmv (motion tracking)
- Documentation building

### Memory Configuration
Default Memory64 configuration:
- Initial: 256 pages (~16MB)
- Maximum: 32768 pages (~2GB)

Adjust in your application code when loading the WASM.

## OpenImageIO Stub

Blender uses OpenImageIO for image I/O. Since the full OpenImageIO is complex to compile for WASM, we use a stub that provides:

- `ustring` class with string interning
- Basic image format signatures
- Hash functions

The stub is at `docker/blender-wasm-build/OpenImageIO-stub/`.

## Troubleshooting

### Build Fails with Header Errors
```
fatal error: 'bits/libc-header-start.h' file not found
```
**Solution**: You're not using the Docker environment. Host headers are mixing with Emscripten sysroot.

### Out of Memory
```bash
# Inside container, use single-threaded build
ninja -j1
```

### Docker Permission Issues
```bash
# Fix Docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Slow Build
- Use `docker compose run --rm -e MAKEFLAGS="-j4"` to limit parallelism
- Build only needed targets: `ninja bin/blender.wasm`

## Output Files

After build, you'll find:

```
build/
├── bin/
│   ├── blender.js       # JavaScript loader
│   └── blender.wasm     # WebAssembly binary
├── lib/
│   └── *.a             # Static libraries
└── source/
    └── blender/         # Generated sources
```

## Integrating with blender-wasm

Copy outputs to your project:
```bash
cp build/bin/blender.* /path/to/blender-wasm/public/wasm/
```

## Advanced: Custom Build

### Debug Build
```bash
docker compose run --rm -e BUILD_TYPE=Debug blender-wasm-build bash
```

### Specific Blender Version
Edit `Dockerfile`:
```dockerfile
ARG BLENDER_BRANCH=blender-v4.2-release
```

### Additional Options
Add to CMake command in `build.sh`:
```bash
-DWITH_OPENEXR=ON \
-DWITH_OCIO=ON \
```

## See Also

- [Blender Developer Docs](https://wiki.blender.org/)
- [Emscripten Docs](https://emscripten.org/)
- [WASM 3.0 Research](WASM_3.md)
- [Architecture](ARCHITECTURE.md)
