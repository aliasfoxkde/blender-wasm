# Blender Web Edition

Blender optimized and compiled to run in the browser using WebAssembly.

## Live Demo

**Try it now**: https://blender-wasm.pages.dev

## Features

- **Browser-Native**: Runs entirely in the browser with WebAssembly
- **Offline-First**: Works without internet after initial load
- **Installable PWA**: Install on desktop or mobile like a native app
- **Progressive Enhancement**: Adapts to your hardware (WebGPU/WebGL/SIMD)
- **Local Storage**: Projects saved locally in your browser
- **Open Source**: Built with transparency and community contribution

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
┌──────────────────────────────┐
│     Blender Core (WASM)       │
└──────────────────────────────┘
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

**MVP Complete** - All 12 phases implemented!

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
