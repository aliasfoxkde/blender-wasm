/* Stub PNG header for WASM cross-compilation */
#ifndef PNG_H
#define PNG_H

#include <stddef.h>
#include <stdint.h>
#include <setjmp.h>

/* Stub PNG structures and functions - not functional, just for compilation */
#define PNG_VERSION_INFO_STRING "stub-1.0"
#define PNG_LIBPNG_VER_STRING "stub"

#define PNG_LIBPNG_VER_MAJOR 1
#define PNG_LIBPNG_VER_MINOR 0
#define PNG_LIBPNG_VER_RELEASE 0

/* PNG color types */
#define PNG_COLOR_TYPE_RGB 2
#define PNG_COLOR_TYPE_RGBA 6
#define PNG_COLOR_TYPE_GRAY 0
#define PNG_COLOR_TYPE_GRAY_ALPHA 4

/* PNG interlace types */
#define PNG_INTERLACE_NONE 0
#define PNG_INTERLACE_ADAM7 1

/* PNG compression types */
#define PNG_COMPRESSION_TYPE_DEFAULT 0

/* PNG filter types */
#define PNG_FILTER_TYPE_DEFAULT 0
#define PNG_FILTER_NONE 0

/* Basic types */
typedef uint8_t png_byte;
typedef int32_t png_int_32;
typedef uint32_t png_uint_32;
typedef int64_t png_int_64;
typedef uint64_t png_uint_64;
typedef size_t png_size_t;

/* Forward declarations */
struct png_struct_def;
struct png_info_def;

/* Pointers */
typedef struct png_struct_def *png_structp;
typedef struct png_info_def *png_infop;
typedef png_infop *png_infopp;

/* Row pointers */
typedef png_byte **png_bytepp;
typedef png_byte *png_bytep;
typedef const png_byte *png_const_bytep;

/* Info structure */
typedef struct png_info_def {
  png_uint_32 width;
  png_uint_32 height;
  int bit_depth;
  int color_type;
  int compression_type;
  int interlace_type;
  int filter_type;
  int channels;
  png_uint_32 rowbytes;
  png_bytepp row_pointers;
} png_info;

/* Struct */
typedef struct png_struct_def {
  png_bytepp row_pointers;
  png_uint_32 width;
  png_uint_32 height;
  int bit_depth;
  int color_type;
  int interlace_type;
  int compression_type;
  int filter_type;
  /* libpng error handling */
  jmp_buf jpeg_err;
} png_struct;

/* Function prototypes - stubs */
static inline png_structp png_create_write_struct(
    const char *user_ver, void *error_ptr, void *error_fn, void *warn_fn) {
  (void)user_ver; (void)error_ptr; (void)error_fn; (void)warn_fn;
  return (png_structp)1;
}

static inline void png_destroy_write_struct(png_structp *png_ptr_ptr, png_infopp info_ptr_ptr) {
  (void)png_ptr_ptr; (void)info_ptr_ptr;
}

static inline void png_set_IHDR(png_structp png_ptr, png_infop info_ptr,
    png_uint_32 width, png_uint_32 height, int bit_depth, int color_type,
    int interlace_type, int compression_type, int filter_type) {
  (void)png_ptr; (void)info_ptr; (void)width; (void)height; (void)bit_depth;
  (void)color_type; (void)interlace_type; (void)compression_type; (void)filter_type;
}

static inline void png_write_image(png_structp png_ptr, png_bytepp image) {
  (void)png_ptr; (void)image;
}

static inline void png_write_end(png_structp png_ptr, png_infop info_ptr) {
  (void)png_ptr; (void)info_ptr;
}

static inline void png_write_rows(png_structp png_ptr, png_bytepp **row, png_uint_32 num_rows) {
  (void)png_ptr; (void)row; (void)num_rows;
}

static inline png_infop png_create_info_struct(png_structp png_ptr) {
  (void)png_ptr;
  static png_info info;
  return &info;
}

#define png_jmpbuf(png_ptr) ((png_ptr)->jpeg_err)

static inline void png_init_io(png_structp png_ptr, FILE *fp) {
  (void)png_ptr; (void)fp;
}

static inline void png_set_compression_level(png_structp png_ptr, int level) {
  (void)png_ptr; (void)level;
}

static inline void png_write_info(png_structp png_ptr, png_infop info_ptr) {
  (void)png_ptr; (void)info_ptr;
}

static inline void png_set_swap(png_structp png_ptr) {
  (void)png_ptr;
}

#endif /* PNG_H */
