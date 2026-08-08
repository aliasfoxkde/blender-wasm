# 00 Operating Rules

These rules are mandatory. If a task conflicts with these rules, stop and document the conflict.

## Honesty Rules

1. Do not call WebGL, Three.js, Canvas2D, SVG, CSS, or TypeScript-rendered geometry "Blender rendering".
2. Do not add a grid, cube, axes, mock viewport, mock render, or placeholder canvas to hide missing native rendering.
3. Do not claim `.blend` loading unless the browser test loads a real file through the WASM runtime and verifies data or output.
4. Do not claim "full Blender" unless a real Blender executable/runtime is running in the browser and producing verified behavior.
5. Do not create stubs for dependencies and then mark the feature complete.
6. Do not replace hard build errors with no-op code unless the document explicitly calls for a temporary probe, and label it as a probe.

## Workstation Safety Rules

1. Do not run full Blender Docker builds by default.
2. Do not run unbounded `ninja -j$(nproc)` for Blender, Cycles, OIIO, OpenEXR, Tint, shaderc, or CPython.
3. Use explicit limits:

   ```bash
   BUILD_JOBS=2 BLENDER_WASM_DOCKER_CPUS=2 BLENDER_WASM_DOCKER_MEMORY=8g
   ```

4. Prefer GitHub Actions or a self-hosted builder for heavy work.
5. If the machine becomes unresponsive, stop the build path and reduce scope. Do not retry with the same command.

## Git Rules

1. Before editing:

   ```bash
   git status --short --branch
   ```

2. Do not revert unrelated user changes.
3. Keep phases in separate commits when possible.
4. Commit messages must say what was actually achieved, not what was attempted.
5. Do not commit generated build trees, dependency downloads, or large build outputs unless the artifact policy explicitly allows them.

## Verification Rules

Every completed phase needs:

1. Exact command run.
2. Pass/fail result.
3. Artifact path and size if an artifact was produced.
4. Browser verification if browser behavior changed.
5. A build note in `docs/build-notes/`.

Required local validation after frontend/runtime changes:

```bash
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm exec playwright test tests/e2e/blender-smoke.spec.ts --project=chromium --workers=1
```

Allowed lint state: warnings are acceptable only if pre-existing and no new warnings were introduced.

## Stop Conditions

Stop and create a build note when any of these happen:

1. A compiler error references a missing dependency that is not in the current phase.
2. A build requires more memory or CPU than the configured limit.
3. A browser test only passes because of mocked render output.
4. A dependency needs a source patch not described in this handoff.
5. A step would require committing artifacts larger than the configured artifact policy.

The stop note must include:

```text
Command:
First failing error:
What was being built:
Expected artifact:
Why this blocks the current phase:
Recommended next action:
```

