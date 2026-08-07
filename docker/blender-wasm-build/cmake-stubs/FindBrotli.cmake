# Stub finder for Brotli - for cross-compilation to WASM

set(BROTLI_FOUND 1)
set(BROTLI_VERSION "1.0")
set(BROTLI_INCLUDE_DIR "")
set(BROTLI_LIBRARIES "")
set(BROTLI_INCLUDE_DIRS "")

# Create imported targets
if(NOT TARGET Brotli::Brotli)
  add_library(Brotli::Brotli INTERFACE IMPORTED)
  set_target_properties(Brotli::Brotli PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()

if(NOT TARGET Brotli::Common)
  add_library(Brotli::Common INTERFACE IMPORTED)
  set_target_properties(Brotli::Common PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()

if(NOT TARGET Brotli::Dec)
  add_library(Brotli::Dec INTERFACE IMPORTED)
  set_target_properties(Brotli::Dec PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()

if(NOT TARGET Brotli::Enc)
  add_library(Brotli::Enc INTERFACE IMPORTED)
  set_target_properties(Brotli::Enc PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
