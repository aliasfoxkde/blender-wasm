# Stub finder for ShaderC - for cross-compilation to WASM

set(ShaderC_FOUND 1)
set(ShaderC_VERSION "1.0")
set(SHADERC_LIBRARY "")
set(SHADERC_INCLUDE_DIR "")

if(NOT TARGET ShaderC::ShaderC)
  add_library(ShaderC::ShaderC INTERFACE IMPORTED)
  set_target_properties(ShaderC::ShaderC PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
