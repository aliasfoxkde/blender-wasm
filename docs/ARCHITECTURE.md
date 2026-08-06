# Architecture

## Overview

Blender Web Edition is a Progressive Web Application (PWA) that delivers Blender functionality in the browser using WebAssembly.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Blender Web Edition                       │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (SolidJS)                                        │
│  ┌─────────────┬─────────────┬─────────────┬──────────┐ │
│  │  Dashboard  │  Viewport   │  Settings   │  Shell   │ │
│  └─────────────┴─────────────┴─────────────┴──────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────┐ │
│  │ AI       │ Plugins  │ Collab   │ Automation│ Perform │ │
│  │ Gateway  │ Manager  │ Manager  │ API       │ Manager │ │
│  └──────────┴──────────┴──────────┴──────────┴─────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                              │
│  ┌──────────┬──────────┬──────────┬─────────────────────┐ │
│  │ Projects │ Profiles │ Settings │ OPFS                │ │
│  │ (IDB)   │ (IDB)    │ (localS) │ (File System)      │ │
│  └──────────┴──────────┴──────────┴─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Runtime Layer                                              │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │ Module        │ WASM         │ Service              │ │
│  │ Registry      │ Loader       │ Worker               │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Platform Layer                                             │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │ PWA          │ Download     │ Hardware            │ │
│  │ ServiceWorker│ Manager     │ Profiler            │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Modules

### UI Layer (`src/`)

| Module | Purpose |
|--------|---------|
| `components/` | Reusable UI components (Header, Dashboard, etc.) |
| `shell/` | Shell components (TemplateGallery, AIAssistant, etc.) |

### Service Layer (`src/`)

| Module | Purpose |
|--------|---------|
| `ai/` | AI Gateway and Service for structured APIs |
| `plugins/` | Plugin system with lifecycle management |
| `collaboration/` | Sharing and real-time collaboration |
| `automation/` | REST API for external integrations |
| `performance/` | Performance monitoring and optimization |

### Storage Layer (`src/storage/`)

| Module | Purpose |
|--------|---------|
| `ProjectStorage` | IndexedDB for project metadata |
| `ProfileStorage` | IndexedDB for user profiles |
| `SettingsStorage` | localStorage for app settings |
| `OPFSStorage` | Origin Private File System for .blend files |

### Runtime Layer (`src/runtime/`)

| Module | Purpose |
|--------|---------|
| `ModuleRegistry` | Central registry for WASM modules |
| `ModuleManager` | High-level module operations |
| `WASMLoader` | Low-level WASM loading with progress |

### Platform Layer (`src/platform/`)

| Module | Purpose |
|--------|---------|
| `ServiceWorker` | PWA service worker management |
| `DownloadManager` | Resumable downloads with progress |
| `PWAInstall` | Native install prompt handling |

## Data Flow

### Loading a Project

```
User → Dashboard → ProjectStorage (IDB) → OPFSStorage → Render
```

### AI Command Processing

```
User → AIAssistant → AIGateway → Plugin Handler → Scene Graph → Render
```

### Plugin Loading

```
PluginManager → ModuleRegistry → WASMLoader → Plugin Instance → Hooks
```

## State Management

- **SolidJS Signals**: Component-level reactivity
- **SolidJS Store**: Complex state with mutations
- **Module state**: Each manager maintains its own state
- **No external state library**: Keeping dependencies minimal

## Security Model

1. **Service Worker**: Isolated from main thread
2. **OPFS**: Sandboxed file system access
3. **Plugin Permissions**: Explicit permission grants
4. **CORS**: Origin-based restrictions on API
5. **No eval()**: All code is typed and validated

## Performance Considerations

1. **Lazy Loading**: Modules load on demand
2. **Code Splitting**: Separate chunks for large features
3. **Streaming Compilation**: WASM compiles progressively
4. **Worker Pool**: Offload heavy computation
5. **Virtual DOM-free**: SolidJS for minimal overhead

## Build Output

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── vendor-[hash].js
│   └── *.css
├── wasm/           # Blender WASM modules (future)
├── sw.js           # Service worker
└── manifest.webmanifest
```

## Deployment

- **Cloudflare Pages**: Primary hosting
- **GitHub Actions**: CI/CD pipeline
- **PWA**: Offline support via service worker
- **CDN**: Global edge caching

## Future Architecture Considerations

- **WebGPU**: Native GPU access for rendering
- **SharedArrayBuffer**: Multi-threaded WASM
- **WASM GC**: Garbage collection for WASM
- **Component Model**: Composable WASM modules
