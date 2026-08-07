# Stub finder for PNG - for cross-compilation to WASM

set(PNG_FOUND 1)
set(PNG_VERSION "1.6")
set(PNG_LIBRARY "")
set(PNG_INCLUDE_DIR "")
set(PNG_PNG_INCLUDE_DIR "")

if(NOT TARGET PNG::PNG)
  add_library(PNG::PNG INTERFACE IMPORTED)
  set_target_properties(PNG::PNG PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
