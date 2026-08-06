set(OpenImageIO_FOUND TRUE)
set(OpenImageIO_VERSION "2.5.18.0")

# Main OpenImageIO library
add_library(OpenImageIO::OpenImageIO STATIC IMPORTED)
set_target_properties(OpenImageIO::OpenImageIO PROPERTIES
    IMPORTED_LOCATION "${CMAKE_CURRENT_SOURCE_DIR}/build/libOpenImageIO_Stub.a"
)

# Create oiiotool as an IMPORTED executable target
add_executable(OpenImageIO::oiiotool IMPORTED)
set_target_properties(OpenImageIO::oiiotool PROPERTIES
    IMPORTED_LOCATION "/bin/true"
)

set(OPENIMAGEIO_TOOL "/bin/true")

set(OPENIMAGEIO_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/include")
include_directories("${OPENIMAGEIO_INCLUDE_DIR}")
