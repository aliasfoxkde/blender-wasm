# Blender WASM Build Environment

This directory contains the Docker-based build environment for cross-compiling Blender to WebAssembly.

## Current Status

⚠️ **Note**: Blender's CMake build system has complex native library dependencies that make pure cross-compilation challenging. The Docker environment is correctly configured but may require additional setup for full builds.

## What Works

✅ **Docker Image Built Successfully**
- Emscripten SDK 3.1.70
- OpenImageIO stub library with trivially copyable `ustring`
- Blender source code (v4.2-release)
- Git LFS properly handled

⚠️ **CMake Configuration**
- Requires library stubs or Emscripten ports for native dependencies
- Full build may need additional CMake patches

## Quick Start

### Build the Docker Image

```bash
cd docker/blender-wasm-build
docker compose build
```

### Run Interactive Shell

```bash
docker compose run --rm blender-wasm-build bash
```

### Test CMake Configuration

Inside the container:
```bash
source /emsdk/emsdk_env.sh
mkdir -p build && cd build
emcmake cmake /build/src -G Ninja \
    -DWITH_OPENSIMAGEIO=ON \
    -DOPENIMAGEIO_ROOT=/openimageio-stub \
    -DWITH_CYCLES=OFF \
    -DWITH_GHOST_X11=OFF \
    -DWITH_GHOST_WAYLAND=OFF \
    -DWITH_GHOST_SDL=OFF \
    -DWITH_PYTHON=OFF \
    -DWITH_LIBMV=OFF
```

## The Challenge: Native Library Dependencies

Blender's CMake build system (`build_files/cmake/platform/platform_unix.cmake`) requires native libraries during configuration:

- JPEG, PNG, ZLIB (image I/O)
- Freetype (font rendering)
- Various other codecs

When cross-compiling, CMake finds the **host** (x86_64) libraries instead of the **target** (wasm32) libraries.

### Solutions

#### 1. Emscripten Ports (Recommended)
Use Emscripten's pre-built WASM libraries:
```bash
emcmake cmake ... -sUSE_LIBJPEG=1 -sUSE_LIBPNG=1 -sUSE_ZLIB=1
```

#### 2. Stub FindXXX.cmake Modules
Provide empty stub modules that don't actually link:
```cmake
# FindJPEG.cmake
set(JPEG_FOUND 1)
set(JPEG_LIBRARY "")
set(JPEG_INCLUDE_DIR "")
```

#### 3. Native Build Environment
For complete builds, use a native Linux x86_64 environment and then cross-compile components.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BUILD_TYPE` | `Release` | CMake build type |
| `BLENDER_BRANCH` | `blender-v4.2-release` | Blender Git branch |

## Files

```
docker/blender-wasm-build/
├── Dockerfile              # Multi-stage build image
├── docker-compose.yml      # Container config
├── build.sh              # Build script
├── OpenImageIO-stub/     # OpenImageIO compatibility stub
│   ├── include/         # Header files
│   ├── build/            # Pre-built stub library
│   └── CMakeLists.txt
└── README.md
```

## OpenImageIO Stub

We provide a minimal OpenImageIO stub because:
- Full OpenImageIO is complex to compile for WASM
- Blender only needs `ustring` class and basic image format signatures
- Our stub uses pointer-based string interning for thread safety with `std::atomic<UString>`

## Next Steps

1. **Test CMake configuration** - Works but may need library stubs
2. **Complete the build** - Requires either Emscripten ports or CMake patches
3. **Integrate with blender-wasm** - Copy WASM output to `public/wasm/`

## Troubleshooting

### "Could NOT find JPEG"
Native library not found. Use Emscripten ports or stub modules.

### "bits/libc-header-start.h not found"
Host/system headers mixing with Emscripten sysroot. Use Docker.

### Build hangs
Reduce parallelism: `ninja -j2` inside container.

## See Also

- [Build Documentation](../../docs/BUILD.md)
- [Blender Developer Docs](https://wiki.blender.org/)
- [Emscripten Ports](https://emscripten.org/docs/compiling/Building-Projects.html#using-ports)
