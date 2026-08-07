# Stub finder for JPEG - for cross-compilation to WASM
# The actual library will be provided by Emscripten port at link time

set(JPEG_FOUND 1)
set(JPEG_VERSION "62")
set(JPEG_LIBRARY "")
set(JPEG_INCLUDE_DIR "")

# Create imported target
if(NOT TARGET JPEG::JPEG)
  add_library(JPEG::JPEG INTERFACE IMPORTED)
  set_target_properties(JPEG::JPEG PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
