# Project Summary

## Blender Web Edition - In Progress

### Overview

Blender Web Edition is a next-generation web-native Blender distribution, compiled to run in the browser using WebAssembly. The project aims to deliver a desktop-class Blender experience with:

- Near-native execution through WebAssembly
- Offline-first architecture
- Installable PWA
- AI-native interfaces
- Plugin marketplace
- Local-first storage
- Modern cloud capabilities (optional)

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | SolidJS + TypeScript |
| Build | Vite |
| PWA | Workbox |
| Runtime | WebAssembly + Emscripten |
| Graphics | WebGPU with WebGL fallback |
| Storage | OPFS + IndexedDB |
| Hosting | Cloudflare Pages |
| Testing | Playwright + Vitest |

### Phases Completed

1. ✅ **Research & MVP Scaffold** - ADRs, project structure, tooling
2. ✅ **Core Platform** - PWA, Service Worker, Download Manager
3. ✅ **Web Shell** - Dashboard, templates, news, AI assistant
4. ✅ **Runtime Loader** - Modular WASM loading, dependency resolution
5. ✅ **Local Storage** - IndexedDB, OPFS, settings, profiles
6. ✅ **Login & Identity** - Guest, local, cloud authentication
7. ✅ **Plugin Platform** - Extension system with permissions
8. ✅ **AI Platform** - Structured API for scene operations
9. ✅ **Automation API** - REST API for integrations
10. ✅ **Performance** - Monitoring, presets, streaming compilation
11. ✅ **Collaboration** - Sharing, comments (stub)
12. ✅ **Enhancements** - Integration and polish

### Project Statistics

- **Total Files**: ~60
- **Total Commits**: 12 phases
- **Lines of Code**: ~15,000+
- **Documentation**: Complete ADRs, phase docs, README

### Key Files

```
├── README.md              # Project overview and quick start
├── CLAUDE.md              # Claude Code guidance
├── package.json           # Dependencies and scripts
├── vite.config.ts        # Vite configuration with PWA
├── src/
│   ├── components/       # UI components
│   ├── core/             # Hardware profiler
│   ├── platform/         # PWA, downloads, service worker
│   ├── shell/           # Dashboard, templates, AI
│   ├── runtime/          # WASM module loading
│   ├── storage/           # IndexedDB, OPFS, profiles
│   ├── auth/              # Authentication
│   ├── plugins/           # Plugin system
│   ├── ai/               # AI gateway and service
│   ├── automation/        # REST API
│   ├── performance/       # Performance monitoring
│   ├── collaboration/     # Collaboration features
│   └── blender/           # Main app integration
├── docs/
│   ├── adr/              # Architecture Decision Records
│   ├── phases/           # Phase documentation
│   └── PLANNING.md       # Full project plan
├── scripts/               # Build scripts
└── public/               # Static assets
```

### Quick Start

```bash
# Clone and install
git clone https://github.com/aliasfoxkde/blender-wasm.git
cd blender-wasm
pnpm install

# Development
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview

# Serve locally (no Node.js required)
./start.sh
```

### Deployment

**Cloudflare Pages** (Recommended):
1. Fork this repository
2. Connect to Cloudflare Pages
3. Set build command: `pnpm build`
4. Set output directory: `dist`
5. Deploy!

**GitHub Releases**:
Download the release archive and run `./start.sh`

### License

- **Core Application**: GPL-3.0-or-later
- **Build Scripts & Tooling**: MIT

### Status

**In Progress** - The web shell scaffold and architecture are complete. Blender WASM integration is pending. The MVP definition per `docs/MVP_EXECUTION_PLAN.md` requires:

1. A reproducible Docker build producing a Blender-derived WASM artifact
2. The artifact loaded through the Emscripten-generated JS loader
3. A browser smoke test proving Blender code executed
4. All quality gates passing (typecheck, lint, test, build)

### Acknowledgments

- [Blender](https://www.blender.org) - The world's leading open-source 3D creation suite
- [Emscripten](https://emscripten.org) - C/C++ to WebAssembly compiler
- [SolidJS](https://solidjs.com) - Reactive UI framework
- [WebAssembly](https://webassembly.org) - Binary instruction format for browsers
