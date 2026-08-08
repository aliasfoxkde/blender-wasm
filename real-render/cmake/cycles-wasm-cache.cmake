# cycles-wasm-cache.cmake
# CMake cache flags for headless Cycles WASM build.
# Consumed by configure-cycles.sh via `cmake -C <this-file>`.

# ---------------------------------------------------------------------------
# Core options
# ---------------------------------------------------------------------------
set(WITH_BLENDER                    OFF  CACHE BOOL "")
set(WITH_CYCLES_STANDALONE          ON   CACHE BOOL "")
set(WITH_CYCLES_STANDALONE_GUI      OFF  CACHE BOOL "")
set(WITH_PYTHON                     OFF  CACHE BOOL "")
set(WITH_OPENGL_BACKEND             OFF  CACHE BOOL "")
set(WITH_VULKAN_BACKEND             OFF  CACHE BOOL "")
set(WITH_GHOST_SDL                  OFF  CACHE BOOL "")
set(WITH_GHOST_X11                  OFF  CACHE BOOL "")
set(WITH_GHOST_WAYLAND              OFF  CACHE BOOL "")
set(WITH_LIBS_PRECOMPILED           OFF  CACHE BOOL "")
set(WITH_STRICT_BUILD_OPTIONS       OFF  CACHE BOOL "")
set(WITH_TESTS                      OFF  CACHE BOOL "")
set(WITH_GTESTS                     OFF  CACHE BOOL "")

# ARM NEON — Blender checks this at configure time and may warn/error on WASM
set(SUPPORTS_NEON_BUILD             FALSE CACHE INTERNAL "")

# ---------------------------------------------------------------------------
# Cycles device
# ---------------------------------------------------------------------------
set(WITH_CYCLES_CPU                  ON   CACHE BOOL "")
set(WITH_CYCLES_CUDA                OFF  CACHE BOOL "")
set(WITH_CYCLES_OPENCL              OFF  CACHE BOOL "")
set(WITH_CYCLES_DEVICE_ONLY         ON   CACHE BOOL "")

# ---------------------------------------------------------------------------
# Cycles kernels
# ---------------------------------------------------------------------------
set(WITH_CYCLES_KERNEL_LLVM         ON   CACHE BOOL "")
set(WITH_CYCLES_BLENDER_CPU         OFF  CACHE BOOL "")
set(WITH_CYCLES_COMPUTE_DEVICE_CPU  ON   CACHE BOOL "")

# ---------------------------------------------------------------------------
# Dependencies (paths injected by dep-common.sh via CMAKE_PREFIX_PATH)
# ---------------------------------------------------------------------------
# Each dependency should be findable via find_package() after
# adding ${SYSROOT} to CMAKE_PREFIX_PATH in configure-cycles.sh.
