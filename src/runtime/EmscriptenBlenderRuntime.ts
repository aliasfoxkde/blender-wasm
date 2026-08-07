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
  TOTAL_MEMORY?: number;
  TOTAL_STACK?: number;
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
    // Attempt to load the Emscripten-generated blender.js
    // This file is produced by the Docker build process
    try {
      const blenderJsUrl = `${ARTIFACT_BASE}/blender.js`;

      // Fetch the JS loader to get module factory function
      const response = await fetch(blenderJsUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(
          `Blender WASM artifact not found at ${blenderJsUrl}.\n` +
          `Run: ./scripts/build-blender-wasm.sh build`
        );
      }

      // Create a script element to load the Emscripten module
      // The generated module exports a `CreateBlenderWasmModule` factory
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = blenderJsUrl;
        script.type = 'module';

        script.onload = async () => {
          try {
            // The Emscripten-generated module should be available globally
            // as CreateBlenderWasmModule (or whatever EXPORT_NAME is set to)
            const ModuleFactory = (globalThis as Record<string, unknown>).CreateBlenderWasmModule;
            if (typeof ModuleFactory !== 'function') {
              throw new Error(
                `Emscripten module factory CreateBlenderWasmModule not found. ` +
                `The artifact may not be a valid Emscripten output.`
              );
            }

            // Configure the module with our options
            const moduleConfig: Partial<EmscriptenModule> = {
              locateFile: (filename: string) => {
                // Emscripten calls this to find the .wasm binary
                return `${ARTIFACT_BASE}/${filename}`;
              },
              print: (message: string) => {
                console.log(`[Blender] ${message}`);
              },
              printErr: (message: string) => {
                console.error(`[Blender] ${message}`);
              },
              canvas: canvas,
              // Disable initial run - we control when to execute
              noInitialRun: true,
              // Memory settings for 8GB support
              TOTAL_MEMORY: 256 * 1024 * 1024, // 256MB initial, grows with ALLOW_MEMORY_GROWTH
              TOTAL_STACK: 8 * 1024 * 1024, // 8MB stack
            };

            // Instantiate the module
            const module = await ModuleFactory(moduleConfig);
            resolve(module as EmscriptenModule);
          } catch (error) {
            reject(error);
          }
        };

        script.onerror = () => {
          reject(new Error(
            `Failed to load Blender JS loader from ${blenderJsUrl}.\n` +
            `Run: ./scripts/build-blender-wasm.sh build`
          ));
        };

        document.head.appendChild(script);
      });
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

      // Fallback: check if runtime initialized
      if (module.onRuntimeInitialized) {
        return {
          success: true,
          message: 'Blender runtime initialized (smoke test not implemented)',
          buildInfo: this.instance.buildInfo || undefined,
        };
      }

      return {
        success: false,
        message: 'Runtime not fully initialized',
        error: 'onRuntimeInitialized callback was not called',
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
