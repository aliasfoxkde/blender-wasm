# ADR 001: WebAssembly Toolchain

## Status
Accepted

## Context
We need to compile Blender (C/C++) to WebAssembly for browser execution.

## Decision
Use **Emscripten** as the primary toolchain.

## Rationale
- Emscripten is the only production-ready toolchain for compiling existing C/C++ codebases to WASM without major rewrites
- Provides complete platform adaptation layer: OpenGL-to-WebGL, SDL2, POSIX emulation, filesystem APIs
- Mature pthreads support, SIMD support, and WebGPU integration
- Powers Google Earth and Unity game engine in the browser

## Alternatives Considered
- **LLVM wasm32 target**: Produces raw WASM without any platform interfaces - unusable for Blender
- **wasm-bindgen**: Rust-specific, irrelevant for C/C++ codebases
- **WASI**: Designed for server-side runtimes, not browsers - no browser support
- **wasm3**: Interpreter too slow for real-time 3D rendering

## Consequences
- Bundle sizes will be large; use `-Oz` + Closure Compiler for optimization
- Pthreads require COOP/COEP headers on server deployment
- Asyncify adds overhead; design around native async patterns where possible

## References
- Emscripten documentation: https://emscripten.org/docs/
- Blender build discussions: https://wiki.blender.org/wiki/Building_Blender/WebGPU
