/**
 * RealRenderRuntime.ts
 *
 * Browser runtime for the headless Cycles WASM render artifact.
 *
 * This runtime is entirely separate from BlenderBlenlibRuntime — it loads
 * the real-render artifact (not blenlib) and exposes renderSampleScene().
 * It does NOT provide a Blender editor, viewport, or Python runtime.
 */

import type {
  RealRenderManifest,
  RealRenderResult,
  RealRenderProgress,
} from './RealRenderTypes';

const ARTIFACT_BASE = '/wasm/real-render';
const MANIFEST_PATH = `${ARTIFACT_BASE}/manifest.json`;

/** Emscripten-generated module interface for the Cycles WASM artifact */
interface CyclesModule {
  locateFile?: (filename: string) => string;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
  onRuntimeInitialized?: () => void;
  onAbort?: (reason: unknown) => void;
  noInitialRun?: boolean;
  FS?: {
    readFile: (path: string, opts?: { encoding?: string }) => string | Uint8Array;
    writeFile: (path: string, data: string | Uint8Array) => void;
    mkdir: (path: string) => void;
    chdir: (path: string) => void;
    root: unknown;
  };
  callMain?: (args: string[]) => number;
  ccall?: (ident: string, returnType: string | null, argTypes: string[], args: unknown[]) => unknown;
  cwrap?: <T = unknown>(ident: string, returnType: string | null, argTypes: string[]) => T;
  UTF8ToString?: (ptr: number) => string;
  stringToUTF8?: (str: string, ptr: number, maxBytes: number) => void;
  HEAPU8?: Uint8Array;
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
}

type CyclesModuleFactory = (config: Partial<CyclesModule>) => Promise<CyclesModule>;

type ProgressCallback = (progress: RealRenderProgress) => void;

export class RealRenderRuntime {
  private instance: CyclesModule | null = null;
  private manifest: RealRenderManifest | null = null;
  private loading = false;
  private progressCallbacks: Set<ProgressCallback> = new Set();

  /**
   * Register a progress callback. Returns an unsubscribe function.
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private emit(progress: RealRenderProgress): void {
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * Load the real-render WASM artifact.
   *
   * Steps:
   *  1. Fetch and validate manifest.json
   *  2. Load the JS glue
   *  3. Instantiate WASM
   *
   * Idempotent — subsequent calls return immediately if already loaded.
   */
  async load(): Promise<void> {
    if (this.instance) return;

    if (this.loading) {
      throw new Error('RealRenderRuntime is already loading');
    }

    this.loading = true;

    try {
      this.emit({ phase: 'manifest', message: 'Fetching render manifest…' });
      await this.loadManifest();

      this.emit({ phase: 'instantiate', message: 'Loading render runtime…' });
      await this.instantiateWasm();

      this.instance = await this.instantiateModule();
      this.emit({ phase: 'complete', message: 'Render runtime ready' });
    } catch (err) {
      this.emit({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Failed to load render runtime',
      });
      throw err;
    } finally {
      this.loading = false;
    }
  }

  /**
   * True if the WASM module is loaded and ready.
   */
  isLoaded(): boolean {
    return this.instance !== null;
  }

  /**
   * Run a render of the built-in sample scene.
   *
   * Requires isLoaded() === true.
   * Returns a RealRenderResult — does NOT throw for expected runtime failures.
   */
  async renderSampleScene(): Promise<RealRenderResult> {
    if (!this.instance) {
      return { success: false, error: 'Render runtime not loaded' };
    }

    this.emit({ phase: 'render', message: 'Rendering scene…' });
    const start = performance.now();

    try {
      const module = this.instance;

      if (!module.FS) {
        return { success: false, error: 'WASM FS not available' };
      }

      // The Cycles WASM binary may produce output to /tmp/ by default.
      // We invoke callMain with the render args for the sample scene.
      let exitCode = 0;
      if (module.callMain) {
        exitCode = module.callMain([
          '-b',     // background (headless)
          '-o', '/tmp/render',
          '-F', 'PNG',
          '/scenes/scene.xml',
        ]);
      }

      const elapsedMs = performance.now() - start;

      if (exitCode !== 0) {
        return { success: false, elapsedMs, error: `Render exited with code ${exitCode}` };
      }

      // Read output
      let imageBytes: Uint8Array | undefined;
      let width: number | undefined;
      let height: number | undefined;

      try {
        const data = module.FS.readFile('/tmp/render.png', { encoding: 'binary' });
        imageBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

        // PNG dimensions from IHDR: bytes 16-24 are width(4) and height(4) big-endian
        if (imageBytes.length > 24) {
          const dv = new DataView(imageBytes.buffer, imageBytes.byteOffset + 16, 8);
          width = dv.getUint32(0, false);
          height = dv.getUint32(4, false);
        }
      } catch {
        // Output file not found — render may have succeeded but written elsewhere
        return {
          success: false,
          elapsedMs,
          error: 'Render completed but output file not found at /tmp/render.png',
        };
      }

      // Create a Blob URL for display
      let imageUrl: string | undefined;
      if (imageBytes) {
        // slice() creates a copy as a plain ArrayBuffer, satisfying BlobPart
        const buf = imageBytes.buffer.slice(imageBytes.byteOffset, imageBytes.byteOffset + imageBytes.byteLength) as ArrayBuffer;
        const blob = new Blob([buf], { type: 'image/png' });
        imageUrl = URL.createObjectURL(blob);
      }

      this.emit({ phase: 'complete', message: 'Render complete' });

      return {
        success: true,
        imageUrl,
        imageBytes,
        width,
        height,
        elapsedMs,
      };
    } catch (err) {
      const elapsedMs = performance.now() - start;
      const error = err instanceof Error ? err.message : 'Render failed';
      this.emit({ phase: 'error', message: error });
      return { success: false, elapsedMs, error };
    }
  }

  /**
   * Dispose the runtime and release resources.
   */
  dispose(): void {
    if (this.instance) {
      // Revoke any blob URLs we created (tracked via module state if needed)
      this.instance = null;
    }
    this.manifest = null;
    this.emit({ phase: 'idle', message: 'Runtime disposed' });
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async loadManifest(): Promise<void> {
    const resp = await fetch(MANIFEST_PATH);
    if (!resp.ok) {
      throw new Error(`manifest.json not found at ${MANIFEST_PATH} — real-render artifact missing`);
    }
    this.manifest = await resp.json() as RealRenderManifest;

    // Validate schema
    if (this.manifest.schema !== 1) {
      throw new Error(`Unsupported manifest schema: ${this.manifest.schema}`);
    }
    if (this.manifest.name !== 'real-render') {
      throw new Error(`Unexpected artifact name: ${this.manifest.name}`);
    }
  }

  private async instantiateWasm(): Promise<void> {
    // The JS glue is fetched and executed; Emscripten will then fetch the .wasm
    const jsUrl = `${ARTIFACT_BASE}/${this.manifest!.artifacts['js']?.path ?? 'real-render.js'}`;

    this.emit({ phase: 'download', message: 'Loading JS glue…' });

    const resp = await fetch(jsUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch ${jsUrl}`);
    }

    const scriptText = await resp.text();

    // Inject the locateFile so Emscripten can find the .wasm alongside the .js
    const factory = new Function('module', 'exports', scriptText + '\n return CreateCyclesModule;') as unknown as CyclesModuleFactory;

    // Create the module config; locateFile ensures .wasm is found at the same base URL
    this._moduleFactory = factory;
  }

  private _moduleFactory: CyclesModuleFactory | null = null;

  private async instantiateModule(): Promise<CyclesModule> {
    if (!this._moduleFactory) {
      throw new Error('Module factory not initialized');
    }

    const module = await this._moduleFactory({
      locateFile: (file: string) => `${ARTIFACT_BASE}/${file}`,
      print: (msg: string) => console.log('[Cycles]', msg),
      printErr: (msg: string) => console.error('[Cycles]', msg),
      onRuntimeInitialized: () => {
        this.emit({ phase: 'instantiate', message: 'WASM runtime initialized' });
      },
      onAbort: (reason: unknown) => {
        console.error('[Cycles] Abort:', reason);
        this.emit({ phase: 'error', message: `Abort: ${reason}` });
      },
    });

    return module;
  }
}

/** Shared singleton instance */
export const realRenderRuntime = new RealRenderRuntime();
