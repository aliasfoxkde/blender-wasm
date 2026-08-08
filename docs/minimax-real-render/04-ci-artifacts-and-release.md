# 04 CI, Artifacts, And Release

## CI Split

Use two CI lanes.

### Lane A: Frontend And Baseline

Runs on every pull request.

Commands:

```bash
pnpm install --frozen-lockfile
pnpm audit:baselines
pnpm audit:real-render
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

Rules:

- Must not build Blender.
- Must not start Docker.
- Must complete quickly.
- Can validate metadata and checked-in small artifacts.

### Lane B: Heavy Real Render Build

Runs only on:

- manual dispatch;
- nightly schedule;
- release branch;
- self-hosted runner.

Required resources:

```text
CPU: 4 or more
RAM: 32 GB preferred
Swap: 16 GB or more
Disk: 100 GB or more
Timeout: several hours
```

Commands:

```bash
bash real-render/scripts/setup-toolchain.sh
bash real-render/scripts/fetch-blender.sh
bash real-render/scripts/build-deps-minimal.sh
bash real-render/scripts/configure-cycles.sh
bash real-render/scripts/build-cycles.sh
bash real-render/scripts/link-cycles-web.sh
node scripts/audit-real-render-artifacts.mjs
```

## Artifact Policy

### Small Artifacts

Allowed in git:

- current minimal baseline;
- current blenlib bridge;
- tiny manifests;
- tiny test scenes;
- documentation.

### Large Artifacts

Do not commit:

- large `.wasm`;
- `.wasm.zst`;
- `.data`;
- `.tar.zst`;
- build trees;
- dependency sysroot;
- downloaded source archives.

Publish large artifacts through:

- GitHub release;
- CI artifact;
- external object storage;
- local ignored cache.

## Required Artifact Manifest

Each artifact bundle must include:

```json
{
  "schema": 1,
  "name": "real-render",
  "version": "0.1.0",
  "engine": "cycles-standalone",
  "source_remote": "https://github.com/HeyPuter/blender",
  "source_ref": "6b031d3d41c392883e3c495aa72343e10d15b43d",
  "emscripten": "6.0.1",
  "created_at": "ISO-8601 timestamp",
  "artifacts": {
    "js": {
      "path": "real-render.js",
      "bytes": 0,
      "sha256": ""
    },
    "wasm": {
      "path": "real-render.wasm.zst",
      "compressed_bytes": 0,
      "decompressed_bytes": 0,
      "sha256": ""
    },
    "assets": {
      "path": "assets.tar.zst",
      "compressed_bytes": 0,
      "decompressed_bytes": 0,
      "sha256": ""
    }
  }
}
```

## `audit-real-render-artifacts.mjs`

This script must:

1. Look for `public/wasm/real-render/manifest.json`.
2. Validate JSON schema fields.
3. Validate every declared file exists.
4. Validate byte sizes match.
5. Validate sha256 if present.
6. Print artifact names and sizes.
7. Exit nonzero if manifest claims support but files are missing.
8. Exit zero with a clear `SKIP` only when no manifest exists and no real-render files exist.

It must not:

- download artifacts;
- run Docker;
- run CMake;
- run Ninja.

## Release Promotion Checklist

Before calling a real render artifact production-ready:

1. Heavy CI build passed.
2. Artifact manifest generated.
3. Browser e2e render test passed.
4. Pixel test confirms non-placeholder output.
5. App copy says `Headless Cycles render proof` or equivalent.
6. Docs list exact limitations.
7. Artifact source SHA is recorded.
8. License obligations are reviewed.

## Rollback Plan

If a render artifact breaks production:

1. Remove or rename `public/wasm/real-render/manifest.json`.
2. The app must fall back to baseline diagnostics.
3. Keep `blender.*` and `blender_blenlib.*` untouched.
4. Create a build note with the bad manifest version and failure mode.

