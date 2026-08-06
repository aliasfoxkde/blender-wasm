# Blender WASM Build Environment

This directory contains the Docker-based build environment for cross-compiling Blender to WebAssembly.

## Why Docker?

Blender's build system has complex dependencies that are difficult to isolate on arbitrary host systems. The Docker environment provides:

- **Complete isolation**: No interference from host system libraries
- **Reproducible builds**: Same environment every time
- **Proper cross-compilation**: Emscripten toolchain properly configured
- **Consistent results**: Builds work identically across machines

## Quick Start

### Build the Docker Image

```bash
cd /nas/Temp/repos/blender-wasm/docker/blender-wasm-build
docker compose build
```

### Run Interactive Build

```bash
docker compose run --rm blender-wasm-build bash
```

Inside the container:
```bash
./build.sh
```

### Automated Build

```bash
docker compose run --rm blender-wasm-build ./build.sh
```

## Build Output

After a successful build, WASM binaries are located at:
- `/blender-build/build/lib/` - Static libraries
- `/blender-build/bin/` - Executable targets

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BUILD_TYPE` | `Release` | CMake build type (Debug/Release) |
| `BUILD_DIR` | `/blender-build/build` | Build output directory |
| `BLENDER_SRC` | `/blender-build/src` | Blender source directory |
| `OPENIMAGEIO_ROOT` | `/openimageio-stub` | OpenImageIO stub location |

## Build Features

The WASM build includes:
- ✅ OpenImageIO support (with stub library)
- ✅ Core Blender functionality
- ✅ GPU shader support
- ✅ File I/O (limited)
- ❌ Python scripting (disabled for smaller build)
- ❌ Cycles renderer (requires Embree)
- ❌ X11/Wayland GUI (headless WASM)

## Memory Configuration

WebAssembly builds use Memory64 for 8GB+ memory support. Configure in your application:

```javascript
const memory = new WebAssembly.Memory({
  initial: 256,  // 16MB initial
  maximum: 32768, // 2GB maximum (adjust for your needs)
  shared: false,
});
```

## Troubleshooting

### Out of Memory During Build

Reduce parallelism:
```bash
docker compose run --rm -e MAKEFLAGS="-j1" blender-wasm-build
```

### Build Hangs

Enable debug output:
```bash
docker compose run --rm -e EMCC_DEBUG=1 blender-wasm-build ./build.sh
```

### Cache Issues

Clear Docker cache and rebuild:
```bash
docker compose down -v
docker compose build --no-cache
```

## Building Without Docker (Advanced)

If you must build on the host system, you need:

1. Emscripten SDK 3.1.70+
2. CMake 3.20+
3. Ninja build
4. Python 3.11+
5. All Blender dependencies (see Blender docs)

The cross-compilation is complex - prefer Docker.

## See Also

- [Blender Developer Documentation](https://wiki.blender.org/)
- [Emscripten Wiki](https://emscripten.org/)
- [blender-wasm Project Documentation](../../docs/)
