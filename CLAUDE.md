# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **next-generation web-native Blender distribution** — a progressive web application (PWA) that delivers Blender in the browser via WebAssembly. The philosophy is "Build the best possible Blender experience using modern web architecture" rather than simply "Run Blender in a browser."

**Current State**: MVP implementation phase. Core platform, testing framework, and documentation are in place.

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm dev             # Start development server
pnpm build           # Build for production
pnpm test            # Run tests (watch mode)
pnpm test:run        # Run tests once
pnpm test:coverage   # Run tests with coverage
pnpm lint            # Run ESLint
pnpm typecheck       # Run TypeScript checks
```

## Architecture

```
Cloudflare Pages (static hosting)
         │
         ▼
┌─────────────────────────────────┐
│         Browser Runtime          │
│  Web Shell (SolidJS) | PWA     │
│  Module Manager | WASM Loader  │
│  Plugin Manager | AI Gateway   │
│  Local API | Automation API     │
└──────────────┬──────────────────┘
               │ (dynamically loaded)
               ▼
┌─────────────────────────────────┐
│     Blender Core (WASM)          │
│  Mesh | Sculpt | Animation       │
│  Geometry Nodes | Rendering      │
│  Import/Export | Extensions      │
└─────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | SolidJS + TypeScript + Vite |
| Styling | Tailwind CSS + CSS variables |
| State | SolidJS Signals/Stores |
| Build | Vite |
| PWA | Workbox (Service Worker) |
| Runtime | WebAssembly + Emscripten |
| Graphics | WebGPU with WebGL fallback |
| Storage | OPFS + IndexedDB + Cache Storage |
| Hosting | Cloudflare Pages |
| Testing | Vitest + happy-dom |

## Source Structure

```
src/
├── ai/           # AI Gateway and AI Service
├── auth/         # Authentication (Guest/Local/Cloud)
├── collaboration/ # Real-time collaboration
├── components/   # SolidJS UI components
├── core/         # Hardware profiler
├── platform/     # PWA, Download Manager, Service Worker
├── plugins/      # Plugin system
├── runtime/      # Module Registry and Manager
├── shell/        # Shell components (AIAssistant, Gallery)
├── storage/      # IndexedDB/OPFS storage
└── utils/        # Utilities
```

## Core Design Principles

1. **Local-first**: Everything important executes locally — modeling, sculpting, rendering, export/import
2. **Offline-first**: After installation, the app works without internet; connectivity only for collaboration/cloud
3. **Progressive Enhancement**: Features adapt based on hardware capability (CPU, GPU, RAM, WebGPU, SIMD, Threads, Memory64)
4. **Instant Perceived Startup**: HTML splash → navigation usable at 300ms → Blender interactive at 2-5s

## Key Modules

- **ModuleManager/ModuleRegistry**: Manages WASM module loading with dependency resolution
- **AIService/AIGateway**: Structured AI APIs for scene manipulation
- **PluginManager**: Plugin lifecycle and permission management
- **StorageManagers**: ProjectStorage, ProfileStorage, SettingsStorage, OPFSStorage
- **DownloadManager**: Resumable downloads with progress tracking
- **PerformanceManager**: Hardware profiling and quality presets

## Testing

Tests are co-located with source files (`*.test.ts`). Global mocks in `tests/setup.ts`.

```bash
pnpm test:run src/runtime/ModuleRegistry.test.ts  # Run single test file
```

## Development Phases

The project is structured in 12 phases (see `docs/PLANNING.md`):
1. Research & Feasibility ✓
2. Core Platform ✓
3. Web Shell (in progress)
4. Runtime Loader ✓
5. Local Storage ✓
6. Login & Identity ✓
7. Plugin Platform ✓
8. AI Platform ✓
9. Local Automation API ✓
10. Performance Architecture (planned)
11. Collaboration ✓
12. Blender Web Edition Enhancements (planned)

## Key Planning Decisions

- **Modular WASM over monolithic**: Blender modules load dynamically (Mesh, Sculpt, Animation, Physics, Cycles, Eevee, Python, etc.)
- **Structured AI APIs over UI automation**: AI communicates through scene graph APIs, not screen scraping
- **Authentication is fully optional**: Guest mode is the default; local profiles work entirely offline
- **Storage separation**: `.blend` files in OPFS, settings/projects metadata in IndexedDB, static assets in Cache Storage

## Documentation

- `docs/PLANNING.md` - Full project planning
- `docs/ARCHITECTURE.md` - System architecture
- `docs/API.md` - Public API reference
- `docs/TESTING.md` - Testing guide
- `docs/CONTRIBUTING.md` - Contribution guidelines
