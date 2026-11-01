# Blender Web Edition

A browser-based PWA shell and experimental WebAssembly host for a future
Blender port. **The full Blender application is not yet integrated or usable
in the browser.**

> **Prototype status:** the live demo showcases the web shell, module/runtime
> infrastructure, local storage, and platform scaffolding. It is not a
> browser build of the Blender editor. See [Current implementation boundary](#current-implementation-boundary).

## Live Demo

**Try it now**: https://blender-wasm.pages.dev

## Current implementation boundary

**Available today**
- Browser shell and PWA navigation.
- Runtime module registry/loader, dependency resolution, and download management.
- Local application storage and profile/settings infrastructure.
- Plugin, AI gateway, and automation scaffolding.
- Experimental minimal and `blenlib` WebAssembly bridge builds.

**Not available yet**
- A complete Blender application compiled to WASM.
- The Blender editor, a real Blender viewport, or Blender scene editing.
- Browser execution of Blender Python/`bpy` workflows.
- Cycles rendering or verified real Blender render output.
- Full `.blend` open/edit/save workflows driven by Blender core.

The MVP acceptance criteria require a reproducible Blender-derived WASM
artifact, a browser test proving Blender code executes, and verified output
files. Until those pass, describe this as a **WebAssembly shell prototype**,
not "Blender in the browser." See [Build reality check](docs/BUILD.md),
[project summary](docs/MVP_SUMMARY.md), and [full Blender later](docs/minimax-real-render/05-full-blender-later.md).

## Features

- **Browser shell**: SolidJS application shell and client-side platform runtime
- **Offline-first PWA**: Service worker and local-first application storage
- **Installable**: PWA install support on compatible desktop and mobile browsers
- **Runtime infrastructure**: Module registry, dependency-aware WASM loader, and download management
- **Local storage**: IndexedDB/OPFS-backed application data and project metadata
- **Experimental WASM bridges**: Minimal Blender-derived `clog`/allocator and `blenlib` bridge work; not a complete Blender runtime
- **Open source**: Build and recovery work is documented in the repository

## Quick Start

### Option 1: Live Website (Recommended)

Visit https://blender-wasm.pages.dev - no installation required.

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/aliasfoxkde/blender-wasm.git
cd blender-wasm

# Install dependencies (pnpm recommended)
pnpm install

# Start development server
pnpm dev
```

Open http://localhost:5173 in your browser.

### Option 3: Build & Serve Locally

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Serve the built files
./start.sh
# or
python3 -m http.server 8080 --directory dist
```

The app will be available at http://localhost:8080

### Option 4: GitHub Release

Download the latest release from the Releases page. Run `start.sh` to serve locally.

## System Requirements

### Minimum
- Modern browser (Chrome, Firefox, Safari, Edge)
- 4GB RAM
- WebGL support

### Recommended
- Chrome or Edge (full WebGPU support)
- 8GB+ RAM
- Discrete GPU
- Chrome 113+ / Safari 26+ / Firefox with WebGL fallback

## Architecture

```
┌──────────────────────────────┐
│        Cloudflare Pages       │
└──────────────┬───────────────┘
               │
      Static Assets + PWA
               │
               ▼
┌──────────────────────────────┐
│       Browser Runtime         │
├──────────────────────────────┤
│ Web Shell | WASM Loader       │
│ Module Manager | Asset Cache  │
│ Plugin Manager | AI Gateway   │
└──────────────┬───────────────┘
               │
      Dynamically Loaded
               │
┌─────────────────────────────────────┐
│ Experimental Blender-derived WASM    │
│ bridges (minimal / blenlib only)     │
└─────────────────────────────────────┘

Full Blender runtime, Python/bpy, editor viewport, and Cycles rendering are
not currently integrated.
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | SolidJS + TypeScript |
| Build | Vite |
| PWA | Workbox |
| Runtime | WebAssembly + Emscripten |
| Graphics | WebGPU with WebGL fallback |
| Storage | OPFS + IndexedDB |
| Hosting | Cloudflare Pages |

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm preview:server  # Preview with simple Node.js server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking
```

### Project Structure

```
blender-wasm/
├── src/
│   ├── components/    # UI components
│   ├── core/         # Core functionality (HardwareProfiler)
│   ├── storage/      # IndexedDB & OPFS storage
│   └── styles/       # Global CSS
├── docs/
│   ├── adr/          # Architecture Decision Records
│   ├── phases/       # Phase documentation
│   └── PLANNING.md   # Full project plan
├── scripts/          # Build and deployment scripts
└── public/          # Static assets
```

## Deployment to Cloudflare Pages

### Automatic (Recommended)

1. Fork this repository
2. Go to Cloudflare Dashboard > Pages
3. Create a project and connect your fork
4. Set build command: `pnpm build`
5. Set output directory: `dist`
6. Deploy!

### Required Secrets

In your GitHub repository settings, add:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

### Manual Deploy

```bash
# Build the project
pnpm build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=blender-wasm
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and commit: `git commit -m 'feat: add my feature'`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request

## License

- **Core Application**: GPL-3.0-or-later
- **Build Scripts & Tooling**: MIT

See [LICENSE](LICENSE) for details.

## Status

**Web shell scaffold complete; Blender WASM integration pending**

### Implemented Features

- [x] Project scaffolding (SolidJS + Vite + TypeScript)
- [x] PWA support with offline capability
- [x] Hardware capability detection (CPU, GPU, memory, SIMD, threads)
- [x] UI shell (splash, dashboard, viewport)
- [x] Storage infrastructure (IndexedDB + OPFS + Settings)
- [x] User profiles and authentication (Guest/Local/Cloud)
- [x] Plugin platform with permission model
- [x] AI platform with structured API
- [x] Automation REST API
- [x] Performance monitoring and presets
- [x] Collaboration scaffold (sharing, comments)

See the [MVP Summary](docs/MVP_SUMMARY.md) for complete documentation.

## Acknowledgments

- The [Blender](https://www.blender.org) team for creating an amazing open-source 3D application
- The [Emscripten](https://emscripten.org) team for WebAssembly tooling
- The [WebAssembly](https://webassembly.org) community
