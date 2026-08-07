# Baseline Status Report
**Date**: 2026-08-06

## Git Status

```
M docker/blender-wasm-build/Dockerfile
M docker/blender-wasm-build/OpenImageIO-stub/build/OpenImageIOConfig.cmake
M docker/blender-wasm-build/build.sh
?? docker/blender-wasm-build/cmake-stubs/
?? docker/blender-wasm-build/OpenImageIO-stub/include/OpenImageIO/export.h
?? docs/MVP_EXECUTION_PLAN.md
```

## Quality Gate Results

| Command | Result |
|---------|--------|
| `pnpm typecheck` | FAIL - 36 errors |
| `pnpm lint` | FAIL - ~80 errors/warnings |
| `pnpm test:run` | PASS - 145 tests |
| `pnpm build` | PASS |

## TypeScript Errors (36 total)

### Categories:
1. **WebGPU typings**: `Property 'gpu' does not exist on type 'Navigator'` (4 errors)
2. **Auth provider type mismatch**: Type '"local" | "cloud"' not assignable to 'AuthProvider' (2 errors)
3. **AutomationAPI RouteHandler**: Return types missing `status`, `headers`, `body` properties (17 errors)
4. **ArrayBuffer types**: `Uint8Array` not assignable to `BlobPart` / `ArrayBuffer` (1 error)
5. **ServiceWorker types**: ServiceWorkerRegistration cast issues (2 errors)
6. **Plugin exports**: `UserProfile` not exported from auth module (1 error)
7. **PluginManager**: `void | AIResponse` not assignable to `AIResponse` (2 errors)
8. **PluginDialog**: string comparison issues with `" marketplace"` (note leading space) (3 errors)
9. **App.tsx**: Missing `id` property on Project type (1 error)
10. **PerformanceManager**: string/boolean comparison, unused gpu var (2 errors)
11. **WASMLoader**: Import object type incompatibility (1 error)
12. **Plugin index.ts**: Cannot find `pluginManager` (1 error)

## Lint Errors (~80 total)

### Categories:
1. **Unused variables**: `id`, `type`, `properties`, `childId`, `parentId`, `name`, `objectId`, `materialId`, `nodeId`, `inputs`, `settings`, `frame`, `start`, `end`, `shareId`, `profile`, `device`, `gpu`, `error`, `m`, `task`, `level`, `message`, `size`, `completed`, `total`, `settingsStorage`, `AuthState`, `viewportOnly`, `cmd`
2. **`any` types**: `AIService.test.ts`, `AutomationAPI.ts`, `DownloadManager.ts`, `PWAInstall.ts`
3. **`Function` type**: Unsafe function type in CollaborationManager.ts
4. **`console` warnings**: ~30 console.* statements across multiple files

## Current WASM Status

The repo contains **placeholder/test WASM only** in `public/wasm/`:
- `core.wasm`
- `test.wasm`
- `blender_test.wasm`
- `blender_test_64.wasm`

There is **no real Blender WASM artifact**. The Docker build infrastructure exists but has not yet produced a working artifact.

## Next Action

Implement Phase 0 steps: Fix `pnpm typecheck` errors.
