#ifndef BLENDER_WASM_SHIM_ZSTD_H
#define BLENDER_WASM_SHIM_ZSTD_H

#include <stddef.h>

/*
 * Emscripten does not ship a zstd port setting. Blender's blenlib currently
 * includes zstd helpers from fileops_c.cc, but the minimal browser MVP does not
 * need zstd compression/decompression. Provide compile-time compatibility
 * stubs that report failure for zstd operations instead of linking a fake zstd
 * implementation.
 */

#define ZSTD_VERSION_NUMBER 0

typedef struct ZSTD_CCtx_s ZSTD_CCtx;
typedef struct ZSTD_DCtx_s ZSTD_DCtx;

typedef struct ZSTD_inBuffer_s {
  const void *src;
  size_t size;
  size_t pos;
} ZSTD_inBuffer;

typedef struct ZSTD_outBuffer_s {
  void *dst;
  size_t size;
  size_t pos;
} ZSTD_outBuffer;

typedef enum ZSTD_EndDirective_e {
  ZSTD_e_continue = 0,
  ZSTD_e_flush = 1,
  ZSTD_e_end = 2,
} ZSTD_EndDirective;

typedef enum ZSTD_cParameter_e {
  ZSTD_c_compressionLevel = 100,
} ZSTD_cParameter;

static inline ZSTD_CCtx *ZSTD_createCCtx(void)
{
  return (ZSTD_CCtx *)1;
}

static inline size_t ZSTD_freeCCtx(ZSTD_CCtx *ctx)
{
  (void)ctx;
  return 0;
}

static inline ZSTD_DCtx *ZSTD_createDCtx(void)
{
  return (ZSTD_DCtx *)1;
}

static inline size_t ZSTD_freeDCtx(ZSTD_DCtx *ctx)
{
  (void)ctx;
  return 0;
}

static inline size_t ZSTD_CCtx_setParameter(ZSTD_CCtx *ctx, ZSTD_cParameter parameter, int value)
{
  (void)ctx;
  (void)parameter;
  (void)value;
  return 0;
}

static inline size_t ZSTD_CStreamOutSize(void)
{
  return 16384;
}

static inline size_t ZSTD_DStreamInSize(void)
{
  return 16384;
}

static inline size_t ZSTD_compressStream2(
    ZSTD_CCtx *ctx, ZSTD_outBuffer *output, ZSTD_inBuffer *input, ZSTD_EndDirective end_op)
{
  (void)ctx;
  (void)output;
  (void)input;
  (void)end_op;
  return (size_t)-1;
}

static inline size_t ZSTD_decompressStream(
    ZSTD_DCtx *ctx, ZSTD_outBuffer *output, ZSTD_inBuffer *input)
{
  (void)ctx;
  (void)output;
  (void)input;
  return (size_t)-1;
}

static inline size_t ZSTD_decompressDCtx(
    ZSTD_DCtx *ctx, void *dst, size_t dst_capacity, const void *src, size_t src_size)
{
  (void)ctx;
  (void)dst;
  (void)dst_capacity;
  (void)src;
  (void)src_size;
  return (size_t)-1;
}

static inline unsigned int ZSTD_isError(size_t code)
{
  return code == (size_t)-1;
}

#endif
