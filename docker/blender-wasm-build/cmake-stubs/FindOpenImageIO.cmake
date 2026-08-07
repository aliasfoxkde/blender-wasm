# CMake find module stub for OpenImageIO - for cross-compilation to WASM
# This provides a minimal OpenImageIO configuration for Blender's build system

set(OpenImageIO_FOUND 1)
set(OpenImageIO_VERSION "2.5.18.0")

# The include directory containing OpenImageIO headers
set(OPENIMAGEIO_INCLUDE_DIR "/openimageio-stub/include")

# The library file (stub)
set(OPENIMAGEIO_LIBRARY "/openimageio-stub/build/libOpenImageIO_Stub.a")
set(OPENIMAGEIO_LIBRARIES ${OPENIMAGEIO_LIBRARY})

# Include directories
set(OPENIMAGEIO_INCLUDE_DIRS ${OPENIMAGEIO_INCLUDE_DIR})

# Tool path (stub)
set(OPENIMAGEIO_TOOL "/bin/true")

# No util library needed for stub
set(OPENIMAGEIO_UTIL_LIBRARY "")

# Create imported targets
if(NOT TARGET OpenImageIO::OpenImageIO)
  add_library(OpenImageIO::OpenImageIO STATIC IMPORTED)
  set_target_properties(OpenImageIO::OpenImageIO PROPERTIES
    IMPORTED_LOCATION "${OPENIMAGEIO_LIBRARY}"
    INTERFACE_INCLUDE_DIRECTORIES "${OPENIMAGEIO_INCLUDE_DIR}"
  )
endif()

# PugiXML is not built-in for stub
set(OPENIMAGEIO_PUGIXML_FOUND FALSE)

# Indicate found
include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(OpenImageIO DEFAULT_MSG
    OPENIMAGEIO_LIBRARY OPENIMAGEIO_INCLUDE_DIR)
