# Phase 4: Runtime Loader

**Status**: Completed

## Objectives

- [x] Modular WASM loading system
- [x] Dependency resolution
- [x] Lazy-load modules
- [x] Module caching
- [x] Module prefetching
- [x] Progress tracking

## Components Implemented

### ModuleRegistry
Central registry for all Blender WASM modules with:
- Module metadata (id, name, version, url, dependencies)
- Dependency tracking
- Load order calculation
- Default modules registered (core, mesh, sculpt, animation, physics, geometry-nodes, cycles, eevee, python, usd, fbx, obj)

### WASMLoader
Low-level WASM loading with:
- Progress tracking
- Memory management
- Import object configuration (env, wasi, blender)
- Fetch with range request support
- Module instantiation

### ModuleManager
High-level API with:
- State management and notifications
- Module load/unload
- Prefetch queue
- Recommendation engine for proactive loading

## Module Dependencies

```
core
├── mesh
│   └── sculpt
├── animation
├── physics
├── geometry-nodes
├── cycles
├── eevee
├── python
├── usd
├── fbx
└── obj
```

## Files Created

```
src/runtime/
├── ModuleRegistry.ts   # Module registry and dependency tracking
├── WASMLoader.ts      # Low-level WASM loading with progress
├── ModuleManager.ts   # High-level module API
└── index.ts
```

## Updated Components

| Component | Changes |
|-----------|---------|
| BlenderViewport | Integrated with ModuleManager for loading states |

## Next Steps

Proceed to Phase 5: Local Storage

## Notes

- In production, actual Blender WASM files would be loaded from `/wasm/` path
- Currently the loader simulates loading since Blender WASM hasn't been compiled yet
- Prefetch system allows proactive module loading based on user behavior
