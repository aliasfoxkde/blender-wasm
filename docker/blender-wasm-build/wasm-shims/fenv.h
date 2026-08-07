#ifndef BLENDER_WASM_SHIM_FENV_H
#define BLENDER_WASM_SHIM_FENV_H

#include_next <fenv.h>

/*
 * Emscripten's fenv implementation declares fetestexcept/feclearexcept, but
 * its bits/fenv.h currently defines FE_ALL_EXCEPT as 0 and omits the individual
 * exception constants Blender's expr_pylike_eval.c checks. WebAssembly does not
 * expose hardware floating-point exception flags, so these constants are only
 * compatibility values that keep the target code buildable.
 */
#ifndef FE_INVALID
#  define FE_INVALID 0x01
#endif

#ifndef FE_DIVBYZERO
#  define FE_DIVBYZERO 0x04
#endif

#if defined(FE_ALL_EXCEPT) && FE_ALL_EXCEPT == 0
#  undef FE_ALL_EXCEPT
#  define FE_ALL_EXCEPT (FE_INVALID | FE_DIVBYZERO)
#endif

#endif
