/**
 * Emscripten Blender Runtime
 *
 * Loads real Emscripten-generated Blender WASM output via the generated JS loader.
 * This replaces hand-rolled WASI/WASM instantiation for the Blender artifact.
 *
 * The Emscripten-generated blender.js provides:
 * - Proper memory initialization with locateFile for WASM binary
 * - Filesystem setup (MEMFS, etc.)
 * - pthread/SharedArrayBuffer handling
 * - print/printErr forwarding
 * - Canvas and context setup
 */

export interface BuildInfo {
  version: string;
  buildDate: string;
  compiler: string;
}

export interface SmokeTestResult {
  success: boolean;
  message: string;
  buildInfo?: BuildInfo;
  error?: string;
}

export interface BlenderRuntimeInstance {
  module: EmscriptenModule;
  buildInfo: BuildInfo | null;
}

interface EmscriptenModule {
  locateFile?: (filename: string) => string;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
  onRuntimeInitialized?: () => void;
  onAbort?: (reason: unknown) => void;
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  noInitialRun?: boolean;
  ccall?: (ident: string, returnType: string | null, argTypes: string[], args: unknown[]) => unknown;
  cwrap?: (ident: string, returnType: string | null, argTypes: string[]) => ((...args: unknown[]) => unknown);
  UTF8ToString?: (ptr: number) => string;
  stringToUTF8?: (str: string, ptr: number, maxBytes: number) => void;
  _bw_get_version_json?: () => number;
  _bw_run_smoke_test?: () => number;
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
}

const ARTIFACT_BASE = '/wasm/blender';
const MODULE_FACTORY_NAME = 'CreateBlenderWasmModule';

type EmscriptenModuleFactory = (config: Partial<EmscriptenModule>) => Promise<EmscriptenModule>;

class EmscriptenBlenderRuntime {
  private instance: BlenderRuntimeInstance | null = null;
  private loading = false;
  private loadError: Error | null = null;

  /**
   * Load the Blender runtime via the Emscripten-generated JS loader.
   * The loader handles memory, filesystem, and runtime initialization.
   */
  async load(options?: { canvas?: HTMLCanvasElement }): Promise<BlenderRuntimeInstance> {
    if (this.instance) {
      return this.instance;
    }

    if (this.loading) {
      throw new Error('Blender runtime is already loading');
    }

    this.loading = true;
    this.loadError = null;

    try {
      // Dynamically import the Emscripten-generated JS loader
      // The loader will fetch the .wasm file using locateFile
      const blenderModule = await this.loadBlenderModule(options?.canvas);

      this.instance = {
        module: blenderModule,
        buildInfo: this.extractBuildInfo(blenderModule),
      };

      return this.instance;
    } catch (error) {
      this.loadError = error instanceof Error ? error : new Error(String(error));
      throw this.loadError;
    } finally {
      this.loading = false;
    }
  }

  private async loadBlenderModule(canvas?: HTMLCanvasElement): Promise<EmscriptenModule> {
    try {
      const blenderJsUrl = `${ARTIFACT_BASE}/blender.js`;
      const blenderWasmUrl = `${ARTIFACT_BASE}/blender.wasm`;

      const [jsResponse, wasmResponse] = await Promise.all([
        fetch(blenderJsUrl, { method: 'HEAD' }),
        fetch(blenderWasmUrl, { method: 'HEAD' }),
      ]);

      if (!jsResponse.ok || !wasmResponse.ok) {
        throw new Error(
          `Blender WASM artifact not found at ${ARTIFACT_BASE}/.\n` +
          `Run: ./scripts/build-blender-wasm.sh build`
        );
      }

      const ModuleFactory = await this.loadModuleFactory(blenderJsUrl);
      const module = await ModuleFactory(this.createModuleConfig(canvas));
      this.assertBridgeExports(module);

      return module;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Blender WASM artifact not found')) {
        throw error;
      }
      throw new Error(
        `Failed to load Blender runtime: ${error instanceof Error ? error.message : error}\n` +
        `Ensure the Docker build has produced artifacts at ${ARTIFACT_BASE}/`
      );
    }
  }

  private createModuleConfig(canvas?: HTMLCanvasElement): Partial<EmscriptenModule> {
    return {
      locateFile: (filename: string) => `${ARTIFACT_BASE}/${filename}`,
      print: (message: string) => {
        console.log(`[Blender] ${message}`);
      },
      printErr: (message: string) => {
        console.error(`[Blender] ${message}`);
      },
      canvas,
      noInitialRun: true,
    };
  }

  private async loadModuleFactory(blenderJsUrl: string): Promise<EmscriptenModuleFactory> {
    // For public Emscripten artifacts under /wasm/blender/, skip dynamic import
    // because Vite cannot process /public assets through import().
    // Go directly to script tag loading which works correctly.
    if (blenderJsUrl.startsWith('/wasm/blender/')) {
      return this.loadModuleFactoryViaScriptTag(blenderJsUrl);
    }

    // For non-public or ESM-compatible paths, try dynamic import first
    try {
      const imported = await import(/* @vite-ignore */ blenderJsUrl) as Record<string, unknown>;
      const factory = imported.default ?? imported[MODULE_FACTORY_NAME];
      if (typeof factory === 'function') {
        return factory as EmscriptenModuleFactory;
      }
    } catch {
      // Fall back to script tag loading below.
    }

    return this.loadModuleFactoryViaScriptTag(blenderJsUrl);
  }

  private loadModuleFactoryViaScriptTag(blenderJsUrl: string): Promise<EmscriptenModuleFactory> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = blenderJsUrl;
      script.async = true;

      script.onload = () => {
        const factory = (globalThis as Record<string, unknown>)[MODULE_FACTORY_NAME];
        if (typeof factory === 'function') {
          resolve(factory as EmscriptenModuleFactory);
          return;
        }

        reject(new Error(
          `Emscripten module factory ${MODULE_FACTORY_NAME} not found. ` +
          `Rebuild with -sMODULARIZE=1 -sEXPORT_NAME=${MODULE_FACTORY_NAME}.`
        ));
      };

      script.onerror = () => {
        reject(new Error(
          `Blender WASM artifact not found at ${ARTIFACT_BASE}/. ` +
          `Failed to load Blender JS loader from ${blenderJsUrl}.\n` +
          `Run: ./scripts/build-blender-wasm.sh build`
        ));
      };

      document.head.appendChild(script);
    });
  }

  private assertBridgeExports(module: EmscriptenModule): void {
    const missing = [
      ['_bw_get_version_json', module._bw_get_version_json],
      ['_bw_run_smoke_test', module._bw_run_smoke_test],
      ['UTF8ToString', module.UTF8ToString],
    ].filter(([, value]) => typeof value !== 'function').map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        `Blender WASM bridge is missing exports: ${missing.join(', ')}. ` +
        `Rebuild with the MVP bridge exported.`
      );
    }
  }

  private extractBuildInfo(module: EmscriptenModule): BuildInfo | null {
    try {
      // If the module exposes a cwrap for build info, use it
      if (module._bw_get_version_json) {
        const jsonPtr = module._bw_get_version_json();
        if (jsonPtr && module.UTF8ToString) {
          const jsonStr = module.UTF8ToString(jsonPtr);
          return JSON.parse(jsonStr) as BuildInfo;
        }
      }
    } catch {
      // Build info extraction failed - not critical
    }
    return null;
  }

  /**
   * Run a smoke test to verify Blender code executed.
   * Calls into the WASM module if bw_run_smoke_test is exported.
   */
  async runSmokeTest(): Promise<SmokeTestResult> {
    if (!this.instance) {
      return {
        success: false,
        message: 'Runtime not loaded',
        error: 'Call load() first',
      };
    }

    try {
      const module = this.instance.module;

      if (module._bw_run_smoke_test) {
        const resultPtr = module._bw_run_smoke_test();
        if (resultPtr && module.UTF8ToString) {
          const resultStr = module.UTF8ToString(resultPtr);
          const result = JSON.parse(resultStr) as SmokeTestResult;
          return result;
        }
      }

      return {
        success: false,
        message: 'Smoke test export returned no result',
        error: '_bw_run_smoke_test did not return a valid UTF-8 string pointer',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Smoke test failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get build info from the loaded runtime.
   */
  getBuildInfo(): BuildInfo | null {
    return this.instance?.buildInfo || null;
  }

  /**
   * Check if the runtime is loaded.
   */
  isLoaded(): boolean {
    return this.instance !== null;
  }

  /**
   * Check if the runtime is currently loading.
   */
  isLoading(): boolean {
    return this.loading;
  }

  /**
   * Get the last load error if any.
   */
  getLoadError(): Error | null {
    return this.loadError;
  }

  /**
   * Dispose of the runtime and free resources.
   */
  async dispose(): Promise<void> {
    if (this.instance) {
      // Emscripten modules clean up via Module.quit() if available
      const module = this.instance.module as Record<string, unknown>;
      if (typeof module.quit === 'function') {
        module.quit();
      }
      this.instance = null;
    }
    this.loadError = null;
  }
}

// Singleton instance
export const blenderRuntime = new EmscriptenBlenderRuntime();
