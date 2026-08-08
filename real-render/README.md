# Real Render Build Harness

Standalone build harness for producing a headless Cycles CPU renderer compiled to WebAssembly.

## Objective

Build a browser-ready Cycles WASM artifact that can render a real image when executed, without requiring the full Blender editor UI, GHOST windowing, or WebGPU.

## Objective Scope

Produces:
- `real-render.js` — Emscripten JS glue
- `real-render.wasm` — compiled Cycles WASM
- `assets.tar.zst` — preloaded scene assets

Does NOT produce:
- Blender editor UI or viewport
- GHOST/X11/Wayland/SDL windowing
- WebGPU backend
- Full Blender Python runtime

## Machine Requirements

| Resource | Minimum | Preferred |
|----------|---------|----------|
| CPU cores | 4 | 8+ |
| RAM | 16 GB | 32 GB |
| Swap | 8 GB | 16 GB |
| Disk | 50 GB | 100 GB |
| OS | Linux | Linux |

This is heavy build infrastructure. Do not run on a laptop or unconstrained workstation.

## Resource Limits

Always use explicit limits:

```bash
BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g \
  ./real-render/scripts/build-cycles.sh
```

## Artifact Policy

Large artifacts (`.wasm`, `.wasm.zst`, `.data`, `.tar.zst`) are NOT committed to git.

They are published as:
- CI artifacts on heavy build runs
- GitHub release attachments
- Or fetched from external storage for local development

Small artifacts (manifess, tiny test scenes, scripts) may be committed.

## Setup

```bash
# 1. Pin toolchain and source
bash real-render/scripts/setup-toolchain.sh
bash real-render/scripts/fetch-blender.sh

# 2. Build dependency sysroot
bash real-render/scripts/build-deps-minimal.sh

# 3. Configure Cycles standalone
bash real-render/scripts/configure-cycles.sh

# 4. Build Cycles
bash real-render/scripts/build-cycles.sh

# 5. Relink for browser
bash real-render/scripts/link-cycles-web.sh

# 6. Audit artifacts
node scripts/audit-real-render-artifacts.mjs
```

## Source Reference

Adapted from https://github.com/HeyPuter/blender (commit SHA pinned in `build.config.env`).
License: GPLv2+. See upstream repository for full license terms.

## Disclaimer

This build produces a headless render module. It is not full Blender. The UI label must say "Headless Cycles render proof" — not "Full Blender ready".
