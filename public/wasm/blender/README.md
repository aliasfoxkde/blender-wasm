# Blender WASM Artifacts

This directory is intentionally empty in source control.

Do not add placeholder or hello-world WASM files here. The only valid files are:

- `blender.js`
- `blender.wasm`

Those files must be generated from Blender source or from a wrapper linked against Blender-derived libraries. Build them with:

```bash
./scripts/build-blender-wasm.sh build
```

Before copying artifacts here, run:

```bash
pnpm audit:wasm
```

