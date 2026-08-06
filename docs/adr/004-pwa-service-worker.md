# ADR 004: PWA and Service Worker Strategy

## Status
Accepted

## Context
We need offline-first architecture with installability and background updates.

## Decision
Use **vite-plugin-pwa** with **Workbox** for service worker generation.

## Responsibilities
### Service Worker
- Cache WASM modules, textures, fonts, icons, documentation
- Background downloads with delta updates
- Integrity verification
- Offline fallback pages

### PWA Requirements
- Installable on all platforms (Windows, Linux, macOS, ChromeOS, mobile)
- Web App Manifest with proper icons and theme
- Background sync when connectivity returns

## Storage Strategy
| Type | Technology | Use Case |
|------|------------|-----------|
| IndexedDB | idb wrapper | Projects, settings, cache metadata, AI history |
| OPFS | Native | .blend files, textures, imported assets, thumbnails |
| Cache Storage | Cache API | Icons, shaders, documentation, static assets |

## Consequences
- All assets must be versioned for cache busting
- Need proper cache invalidation strategy for updates

## References
- vite-plugin-pwa: https://vite-pwa-org.github vite-plugin-pwa/
- Workbox: https://developer.chrome.com/docs/workbox
