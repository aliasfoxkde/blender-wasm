# Real Render Artifacts

This directory holds the headless Cycles WASM render artifact.

## Artifact Policy

Large artifacts (`.wasm`, `.wasm.zst`, `.js` with `.wasm`, `.data`) are **not committed** to git.

To develop locally with the real render artifact:

```bash
# Fetch from the configured release URL
node scripts/fetch-real-render-artifacts.mjs

# Or set a specific version / base URL
REAL_RENDER_VERSION=0.1.0 REAL_RENDER_ARTIFACT_BASE=https://example.com/artifacts \
  node scripts/fetch-real-render-artifacts.mjs
```

## No Artifact Present

If this directory is empty or no `manifest.json` is present, the app falls back to
the baseline Blender WASM diagnostics. The `RealRenderPanel` will not render.

## Verification

```bash
# Audit that all declared artifacts are present
pnpm audit:real-render
```

## Adding Artifacts

Artifacts are produced by the heavy build pipeline defined in `real-render/`.
See `docs/minimax-real-render/04-ci-artifacts-and-release.md` for CI and release
distribution policy.
