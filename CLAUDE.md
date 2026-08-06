# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **next-generation web-native Blender distribution** — a progressive web application (PWA) that delivers Blender in the browser via WebAssembly. The philosophy is "Build the best possible Blender experience using modern web architecture" rather than simply "Run Blender in a browser."

**Current State**: Early planning phase. No source code exists yet. The authoritative reference is `docs/PLANNING.md`.

## Architecture

```
Cloudflare Pages (static hosting)
         │
         ▼
┌─────────────────────────────────┐
│         Browser Runtime          │
│  Web Shell | WASM Loader         │
│  Module Manager | Asset Cache    │
│  Plugin Manager | AI Gateway     │
│  Local API                       │
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

## Planned Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript (or SolidJS) |
| Styling | Tailwind CSS + CSS variables |
| State | Zustand or Redux Toolkit |
| Build | Vite |
| PWA | Workbox |
| Runtime | WebAssembly + Emscripten |
| Graphics | WebGPU with WebGL fallback |
| Storage | OPFS + IndexedDB + Cache Storage |
| Hosting | Cloudflare Pages |
| Testing | Playwright + Vitest |

## Core Design Principles

1. **Local-first**: Everything important executes locally — modeling, sculpting, rendering, export/import
2. **Offline-first**: After installation, the app works without internet; connectivity only for collaboration/cloud
3. **Progressive Enhancement**: Features adapt based on hardware capability (CPU, GPU, RAM, WebGPU, SIMD, Threads, Memory64)
4. **Instant Perceived Startup**: HTML splash → navigation usable at 300ms → Blender interactive at 2-5s

## Development Phases

The project is structured in 12 phases:
1. Research & Feasibility (ADRs, POC, browser compatibility)
2. Core Platform (PWA, Service Worker, Hardware Profiler, Download Manager)
3. Web Shell (modern dashboard entry point with recent projects, templates, AI assistant)
4. Runtime Loader (modular WASM loading with lazy-load, prefetch, dependency resolution)
5. Local Storage (IndexedDB, OPFS, Cache Storage)
6. Login & Identity (Guest, Local Profile, Cloud Account — all optional)
7. Plugin Platform (web-native extension system)
8. AI Platform (structured API layer for scene graph, object selection, mesh editing, etc.)
9. Local Automation API (open project, render frame, execute macros)
10. Performance Architecture (SIMD, multithreading, WebGPU, streaming compilation)
11. Collaboration (optional cloud services)
12. Blender Web Edition Enhancements (AI-assisted workflows, marketplace, etc.)

## Key Planning Decisions

- **Modular WASM over monolithic**: Blender modules load dynamically (Mesh, Sculpt, Animation, Physics, Cycles, Eevee, Python, etc.)
- **Structured AI APIs over UI automation**: AI communicates through scene graph APIs, not screen scraping
- **Authentication is fully optional**: Guest mode is the default; local profiles work entirely offline
- **Storage separation**: `.blend` files in OPFS, settings/projects metadata in IndexedDB, static assets in Cache Storage

## No Build Commands Yet

Since no source code exists, no build/test/lint commands are defined. When development begins, refer to `docs/PLANNING.md` for the complete technical approach before implementing.
