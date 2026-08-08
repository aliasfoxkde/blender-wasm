# Stub finder for Zstd - for cross-compilation to WASM

set(Zstd_FOUND 1)
set(Zstd_VERSION "1.5")
set(ZSTD_LIBRARY "")
set(ZSTD_INCLUDE_DIR "")

if(NOT TARGET Zstd::Zstd)
  add_library(Zstd::Zstd INTERFACE IMPORTED)
  set_target_properties(Zstd::Zstd PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
