# Stub finder for ZLIB - for cross-compilation to WASM

set(ZLIB_FOUND 1)
set(ZLIB_VERSION "1.3")
set(ZLIB_LIBRARY "")
set(ZLIB_INCLUDE_DIR "")

if(NOT TARGET ZLIB::ZLIB)
  add_library(ZLIB::ZLIB INTERFACE IMPORTED)
  set_target_properties(ZLIB::ZLIB PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
