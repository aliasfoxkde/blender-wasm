# 03 Browser Runtime And UI Tasks

## UI Principle

The UI must distinguish three states:

1. Blender baseline diagnostics loaded.
2. Real render module unavailable.
3. Real render module loaded and producing output.

Do not make the user infer these states from a grey viewport or a fake canvas.

## Runtime File Layout

Add these files when Phase 7 begins:

```text
src/runtime/RealRenderRuntime.ts
src/runtime/RealRenderRuntime.test.ts
src/runtime/RealRenderTypes.ts
src/components/RealRenderPanel.tsx
tests/e2e/real-render.spec.ts
```

Do not modify `BlenderBlenlibRuntime` except to export shared utility types if needed.

## Artifact Paths

Use a separate public path:

```text
public/wasm/real-render/real-render.js
public/wasm/real-render/real-render.wasm
public/wasm/real-render/real-render.wasm.zst
public/wasm/real-render/real-render.data
public/wasm/real-render/manifest.json
```

Do not put real render artifacts in `public/wasm/blender/` until the artifact is promoted to the primary Blender runtime.

## Runtime API

Use this TypeScript surface:

```ts
export interface RealRenderManifest {
  version: string;
  engine: 'cycles-standalone';
  source_ref: string;
  emscripten: string;
  artifacts: Record<string, {
    path: string;
    bytes?: number;
    compressed_bytes?: number;
    decompressed_bytes?: number;
  }>;
}

export interface RealRenderResult {
  success: boolean;
  imageUrl?: string;
  imageBytes?: Uint8Array;
  width?: number;
  height?: number;
  elapsedMs?: number;
  error?: string;
}

export interface RealRenderProgress {
  phase: 'idle' | 'manifest' | 'download' | 'instantiate' | 'render' | 'complete' | 'error';
  message: string;
  loadedBytes?: number;
  totalBytes?: number;
}
```

Runtime class:

```ts
export class RealRenderRuntime {
  onProgress(callback: (progress: RealRenderProgress) => void): () => void;
  load(): Promise<void>;
  isLoaded(): boolean;
  renderSampleScene(): Promise<RealRenderResult>;
  dispose(): void;
}
```

## Loader Requirements

`load()` must:

1. Fetch `manifest.json`.
2. Validate required artifact entries.
3. Load JS glue.
4. Instantiate WASM.
5. Expose a clear error if artifacts are missing.

If zstd is used, add a separate decompression utility and unit tests. Do not inline large decompression logic into the component.

## Render Requirements

`renderSampleScene()` must:

1. require `isLoaded() === true`;
2. run the WASM render command;
3. read output bytes from the WASM filesystem;
4. create a Blob URL for display;
5. return dimensions if known;
6. return an error object instead of throwing for expected runtime failures.

## UI Component Requirements

`RealRenderPanel.tsx` must show:

- artifact status;
- download/progress state;
- render button;
- render elapsed time;
- output image;
- error details;
- explicit text: `Headless Cycles render proof`, not `Full Blender`.

It must not show:

- fake canvas;
- spinning cube;
- static rendered image pretending to be output;
- hidden success state when render failed.

## E2E Verification

The e2e test must inspect pixels.

Required checks:

1. The render control appears.
2. Running render creates an image or canvas.
3. Width and height are greater than zero.
4. Pixel sample contains more than one color.
5. The page contains `Headless Cycles render proof`.
6. The page does not contain `Full Blender ready`.

If the artifact is missing, the test should fail in CI jobs that claim render support. It can be skipped only in frontend-only CI with an explicit environment variable:

```bash
SKIP_REAL_RENDER_E2E=1
```

