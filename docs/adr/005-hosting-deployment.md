# ADR 005: Hosting and Deployment

## Status
Accepted

## Context
We need to deploy the application to a public URL for easy access.

## Decision
**Cloudflare Pages** as primary hosting with **GitHub Releases** for downloadable bundles.

## Rationale
- Cloudflare Pages: Free hosting, global CDN, built-in CI/CD from GitHub
- Edge functions for optional server-side logic
- HTTP/3 support for modern transport
- Automatic Brotli/Zstd compression

## Deployment Options

### 1. Cloudflare Pages (Recommended)
```bash
# Connect GitHub repo to Cloudflare Pages
# Automatic deployments on push to main
```
Features: Global CDN, free SSL, edge functions, Workers integration

### 2. Local Development
```bash
npm install
npm run dev
```

### 3. GitHub Releases (Downloadable)
```bash
# Release contains pre-built static files
# Run with simple script:
./start.sh  # Serves static files on local port
```
No Node.js dependency required for end users.

## Build Output
```
dist/
├── _worker.js          # Cloudflare Pages function
├── assets/             # JS/CSS bundles
├── wasm/               # Blender WASM modules
└── index.html
```

## Consequences
- Must ensure COOP/COEP headers for pthreads (via `_headers` file or Cloudflare Worker)
- Large WASM files require chunked loading strategy
- Cache-Control headers must be set correctly for versioning

## References
- Cloudflare Pages: https://pages.cloudflare.com
- Cloudflare Workers: https://workers.cloudflare.com
