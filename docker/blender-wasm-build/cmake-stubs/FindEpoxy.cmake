# Stub finder for Epoxy - for cross-compilation to WASM

set(EPOXY_FOUND 1)
set(EPOXY_VERSION "1.5")
set(EPOXY_LIBRARY "")
set(EPOXY_INCLUDE_DIR "")

if(NOT TARGET Epoxy::Epoxy)
  add_library(Epoxy::Epoxy INTERFACE IMPORTED)
  set_target_properties(Epoxy::Epoxy PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
