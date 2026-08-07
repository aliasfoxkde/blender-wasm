# Blender WebAssembly Build Environment
# Multi-stage build for optimal image size and build performance

FROM emscripten/emsdk:3.1.70 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    ninja-build \
    python3 \
    python3-dev \
    python3-pip \
    git \
    git-lfs \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install numpy pyyaml jinja2

# Set up build workspace
WORKDIR /build

# Copy OpenImageIO stub
COPY OpenImageIO-stub/ /openimageio-stub/

# Build OpenImageIO stub for Emscripten
WORKDIR /openimageio-stub/build
RUN emcmake cmake .. -DCMAKE_BUILD_TYPE=Release && \
    emmake make -j$(nproc)

# Copy CMake stub modules for cross-compilation
COPY cmake-stubs/ /cmake-stubs/

# Clone Blender source (skip LFS since we don't need binary assets for WASM build)
WORKDIR /build
ARG BLENDER_BRANCH=blender-v4.2-release
ENV GIT_LFS_SKIP_PULL=1
RUN git lfs install --skip-smudge && \
    git clone --depth 1 --branch ${BLENDER_BRANCH} https://github.com/blender/blender.git src

# Default build command
CMD ["/bin/bash"]
