# OpenImageIO CMake configuration for WASM stub
# This file is loaded by Blender's FindOpenImageIO.cmake

set(OpenImageIO_FOUND 1)
set(OpenImageIO_VERSION "2.5.18.0")

# Get the parent directory (this file is in the build subdirectory)
get_filename_component(OPENIMAGEIO_ROOT "${CMAKE_CURRENT_LIST_DIR}/.." ABSOLUTE)

set(OPENIMAGEIO_INCLUDE_DIR "${OPENIMAGEIO_ROOT}/include")
set(OPENIMAGEIO_TOOL "/bin/true")

# Main OpenImageIO library - point to our stub
set(_openimageio_lib "${OPENIMAGEIO_ROOT}/build/libOpenImageIO_Stub.a")

add_library(OpenImageIO::OpenImageIO STATIC IMPORTED)
set_target_properties(OpenImageIO::OpenImageIO PROPERTIES
    IMPORTED_LOCATION "${_openimageio_lib}"
    INTERFACE_INCLUDE_DIRECTORIES "${OPENIMAGEIO_INCLUDE_DIR}"
)

# Create oiiotool as an IMPORTED executable target
add_executable(OpenImageIO::oiiotool IMPORTED)
set_target_properties(OpenImageIO::oiiotool PROPERTIES
    IMPORTED_LOCATION "/bin/true"
)

# Provide the export file that Blender's FindOpenImageIO.cmake looks for
set(_openimageio_export "${CMAKE_CURRENT_BINARY_DIR}/_openimageio_export")
file(WRITE "${_openimageio_export}" "
OpenImageIO::OpenImageIO
")
