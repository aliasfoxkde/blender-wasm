/**
 * RealRenderTypes.ts
 * Shared types for the headless Cycles render runtime.
 */

/**
 * Artifact manifest for the real-render module.
 * Stored at public/wasm/real-render/manifest.json.
 */
export interface RealRenderManifest {
  schema: number;
  name: string;
  version: string;
  engine: 'cycles-standalone';
  source_remote: string;
  source_ref: string;
  emscripten: string;
  created_at: string;
  artifacts: Record<string, {
    path: string;
    bytes?: number;
    compressed_bytes?: number;
    decompressed_bytes?: number;
    sha256?: string;
  }>;
}

/**
 * Result of a render operation.
 */
export interface RealRenderResult {
  success: boolean;
  /** Blob URL of the rendered image, if an image was produced. */
  imageUrl?: string;
  /** Raw image bytes, if available. */
  imageBytes?: Uint8Array;
  /** Rendered image width in pixels. */
  width?: number;
  /** Rendered image height in pixels. */
  height?: number;
  /** Time taken to render in milliseconds. */
  elapsedMs?: number;
  /** Error message if success is false. */
  error?: string;
}

/**
 * Progress phases for the render runtime lifecycle.
 */
export type RealRenderPhase =
  | 'idle'
  | 'manifest'
  | 'download'
  | 'instantiate'
  | 'render'
  | 'complete'
  | 'error';

/**
 * Progress update from the render runtime.
 */
export interface RealRenderProgress {
  phase: RealRenderPhase;
  message: string;
  loadedBytes?: number;
  totalBytes?: number;
}
