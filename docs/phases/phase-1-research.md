# Phase 1: Research & Feasibility

**Status**: Completed (MVP Scaffold)

## Objectives

- [x] Establish technical viability
- [x] Define performance targets
- [x] Select build toolchain
- [x] Determine required Blender modifications
- [x] Create Architecture Decision Records (ADRs)

## ADRs Created

| ID | Title | Status |
|----|-------|--------|
| 001 | WebAssembly Toolchain | Accepted |
| 002 | Graphics Stack | Accepted |
| 003 | Frontend Framework | Accepted |
| 004 | PWA and Service Worker Strategy | Accepted |
| 005 | Hosting and Deployment | Accepted |
| 006 | Licensing | Accepted |

## Key Decisions

### WebAssembly Toolchain: Emscripten

Emscripten is the only production-ready toolchain for compiling Blender (C/C++) to WASM. It provides:
- OpenGL-to-WebGL conversion
- SDL2 support
- POSIX emulation
- Filesystem APIs
- Pthreads support (requires COOP/COEP headers)

### Graphics Stack: WebGPU + WebGL Fallback

- ~83% global adoption (Chrome 113+, Safari 26+, Edge 113+)
- Firefox lacks WebGPU support (WebGL fallback)
- Use progressive enhancement strategy

### Frontend Framework: SolidJS

- Bundle size: ~7KB vs React's ~45KB
- Fine-grained reactivity for real-time 60fps UI
- Native TypeScript support
- Ideal for performance-critical 3D editor

### Hosting: Cloudflare Pages

- Free hosting with global CDN
- Built-in CI/CD from GitHub
- HTTP/3 support
- Edge functions for server-side logic

## MVP Deliverables

- [x] Project scaffolding (Vite + SolidJS + TypeScript)
- [x] PWA configuration with Workbox
- [x] Hardware profiler for capability detection
- [x] Basic UI shell (Splash, Dashboard, Viewport)
- [x] Storage infrastructure (IndexedDB + OPFS)
- [x] Deployment configuration

## Browser Compatibility

| Browser | WebGPU | WebGL | Status |
|---------|--------|-------|--------|
| Chrome 113+ | Yes | Yes | Full |
| Edge 113+ | Yes | Yes | Full |
| Safari 26+ | Partial | Yes | Limited |
| Firefox | No | Yes | Fallback |
| Opera 99+ | Yes | Yes | Full |
| Samsung Internet 24+ | Yes | Yes | Full |

## Next Steps

Proceed to Phase 2: Core Platform

## Timeline

- Started: August 2026
- Duration: 1 day (accelerated with AI assistance)
