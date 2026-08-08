# Blender WASM Artifacts

This directory is intentionally empty in source control.

Do not add placeholder or hello-world WASM files here. The only valid files are:

- `blender.js`
- `blender.wasm`
- `blender_blenlib.js`
- `blender_blenlib.wasm`

Those files must be generated from Blender source or from a wrapper linked against Blender-derived libraries. Build the minimal runtime with:

```bash
./scripts/build-blender-wasm.sh minimal
```

Build and promote the experimental blenlib runtime with:

```bash
./scripts/build-blender-wasm.sh blenlib-module
```

Before copying artifacts here, run:

```bash
pnpm audit:wasm
pnpm audit:baselines
```
