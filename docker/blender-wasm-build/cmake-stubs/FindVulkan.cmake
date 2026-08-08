# Stub finder for Vulkan - for cross-compilation to WASM

set(VULKAN_FOUND 1)
set(VULKAN_VERSION "1.0")
set(VULKAN_LIBRARY "")
set(VULKAN_INCLUDE_DIR "")

if(NOT TARGET Vulkan::Vulkan)
  add_library(Vulkan::Vulkan INTERFACE IMPORTED)
  set_target_properties(Vulkan::Vulkan PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()
