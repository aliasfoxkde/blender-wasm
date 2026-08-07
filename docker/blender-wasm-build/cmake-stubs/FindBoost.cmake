# CMake find module stub for Boost - for cross-compilation to WASM

set(Boost_FOUND 1)
set(Boost_VERSION "1.84.0")

# Dummy include directory - Boost headers not needed for WASM stub
set(BOOST_INCLUDE_DIR "/cmake-stubs/dummy-include")
set(Boost_INCLUDE_DIR "/cmake-stubs/dummy-include")
set(Boost_INCLUDE_DIRS "/cmake-stubs/dummy-include")

# Empty libraries - no Boost linking needed
set(Boost_LIBRARIES "")
set(Boost_LIBRARY_DIRS "")

# Individual component includes (empty for stub)
set(Boost_FILESYSTEM_INCLUDE_DIR "")
set(Boost_REGEX_INCLUDE_DIR "")
set(Boost_THREAD_INCLUDE_DIR "")
set(Boost_DATE_TIME_INCLUDE_DIR "")
set(Boost_LOCALE_INCLUDE_DIR "")
set(Boost_SYSTEM_INCLUDE_DIR "")

# Create imported targets
if(NOT TARGET Boost::Boost)
  add_library(Boost::Boost INTERFACE IMPORTED)
  set_target_properties(Boost::Boost PROPERTIES
    INTERFACE_INCLUDE_DIRECTORIES ""
  )
endif()

# Individual component targets
foreach(COMPONENT filesystem regex thread date_time locale system)
  if(NOT TARGET Boost::${COMPONENT})
    add_library(Boost::${COMPONENT} INTERFACE IMPORTED)
    set_target_properties(Boost::${COMPONENT} PROPERTIES
      INTERFACE_INCLUDE_DIRECTORIES ""
    )
  endif()
endforeach()
