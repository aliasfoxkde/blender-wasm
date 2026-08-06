cmake_minimum_required(VERSION 3.20)
project(openimageio-stub CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(OpenImageIO_Stub STATIC
    ustring_stub.cpp
)

target_include_directories(OpenImageIO_Stub PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

target_compile_definitions(OpenImageIO_Stub PRIVATE
    OPENIMAGEIO_NO_USING_OCI
)
