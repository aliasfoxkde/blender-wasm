/* wasm_compat.h
 * Emscripten-only typedefs and macros to satisfy Blender source that
 * normally comes from platform headers not available in the WASM environment.
 *
 * Included via: -include wasm_compat.h
 *
 * Only add shims here that are genuinely absent from Emscripten's headers.
 * No stub implementations — if a function is missing, that is a build error
 * that must be resolved at the source or by patching upstream.
 */

#ifndef __WASM_COMPAT_H__
#define __WASM_COMPAT_H__

/* fenv.h — Emscripten provides fenv.h but some constants may be absent */
#ifndef FE_TONEAREST
#define FE_TONEAREST  0
#endif
#ifndef FE_DOWNWARD
#define FE_DOWNWARD   1
#endif
#ifndef FE_UPWARD
#define FE_UPWARD     2
#endif
#ifndef FE_TOWARDZERO
#define FE_TOWARDZERO 3
#endif

/* Emscripten does not define __LONG_MAX__ in 32-bit builds */
#ifndef __LONG_MAX__
#define __LONG_MAX__ 2147483647L
#endif

/* pthread — Emscripten provides pthread support but some builds need this */
#ifndef PTHREAD_PRIO_INHERIT
#define PTHREAD_PRIO_INHERIT 0
#endif

/* WASM page size is 65536 — exposed via Emscripten but guard it */
#ifndef WASM_PAGE_SIZE
#define WASM_PAGE_SIZE 65536
#endif

/* Emscripten puts FS under Module.FS; provide a thin alias for code
   that includes <sys/mman.h> or similar non-existent headers. */
#if defined(__EMSCRIPTEN__) && !defined(MAP_ANONYMOUS)
#define MAP_ANONYMOUS 0x02
#endif

#endif /* __WASM_COMPAT_H__ */
