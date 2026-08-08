# Stub finder for Freetype - for cross-compilation to WASM

set(FREETYPE_FOUND 1)
set(FREETYPE_VERSION "2.13")
set(FREETYPE_LIBRARY "")
set(FREETYPE_INCLUDE_DIRS "")

# Indicate brotli support is available for Freetype
set(HAVE_BROTLI TRUE)

if(NOT TARGET Freetype::Freetype)
  add_library(Freetype::Freetype INTERFACE IMPORTED)
  set_target_properties(Freetype::Freetype PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
