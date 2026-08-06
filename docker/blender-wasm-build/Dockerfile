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

# Clone Blender source
WORKDIR /build
ARG BLENDER_BRANCH=blender-v4.2-release
RUN git clone --depth 1 --branch ${BLENDER_BRANCH} https://github.com/blender/blender.git src

# Default build command
CMD ["/bin/bash"]
