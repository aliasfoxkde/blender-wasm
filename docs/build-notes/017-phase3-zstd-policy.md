# Phase 3: Zstd Policy Decision
Date: 2026-08-07
Agent: MiniMax-M2.7

## Summary

Zstd (Zstandard) compression is **disabled** for the current MVP. This is an intentional policy decision, not a technical limitation.

## Current State

The file `docker/blender-wasm-build/wasm-shims/zstd.h` provides compile-time compatibility stubs that **fail closed**:

```c
static inline size_t ZSTD_compressStream2(...) {
  return (size_t)-1;  // Returns error
}

static inline size_t ZSTD_decompressStream(...) {
  return (size_t)-1;  // Returns error
}
```

This means:
- `bf_blenlib` compiles successfully with zstd support code
- Runtime zstd operations return error values
- No crash, no linking issues, just clear failure

## Policy Decision

**Keep zstd disabled until a real `.blend` file loading milestone requires it.**

Rationale:
1. Current MVP focuses on minimal baseline (clog, guardedalloc, blenlib)
2. `.blend` file loading with zstd compression is a Phase 6+ feature
3. Implementing real zstd would require Emscripten zstd port or WebAssembly zstd library
4. The shim approach is transparent - calling code sees clear errors

## Future Activation

When zstd is needed, options are:

1. **Emscripten zstd port**: Add `-sUSE_ZSTD=1` to linker flags (requires emscripten support)
2. **WASM-native zstd**: Use a pure-WASM zstd implementation
3. **Pre-decompression**: Decompress `.blend` files on server before serving

## Implementation

No code changes required. The policy is already implemented via the fail-closed shim.

## Artifacts Changed

None - this is a policy documentation change.

## Acceptance Criteria

- [x] Zstd shim returns errors, not crashes
- [x] bf_blenlib builds without zstd linking errors
- [x] Policy documented

## Next Phase

Phase 4: Replace Ninja Text Patching With CMake-Level Host Tool Wiring
