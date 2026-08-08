/**
 * Blender Blenlib Runtime
 *
 * Loads the experimental blenlib WASM module which provides access to
 * real Blender blenlib functions including hash and string utilities.
 */

export interface BlenlibCapabilities {
  module: string;
  version: string;
  build_type: string;
  libraries: Array<{
    name: string;
    provides: string[];
  }>;
  functions: string[];
  status: string;
}

interface BlenlibModule {
  locateFile?: (filename: string) => string;
  print?: (message: string) => void;
  printErr?: (message: string) => void;
  onRuntimeInitialized?: () => void;
  onAbort?: (reason: unknown) => void;
  noInitialRun?: boolean;
  UTF8ToString?: (ptr: number) => string;
  stringToUTF8?: (str: string, ptr: number, maxBytes: number) => void;
  _bw_blenlib_capabilities_json?: () => number;
  _bw_blenlib_smoke_test?: () => number;
  _bw_hash_string_mm2a?: (str: number) => number;
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
}

const ARTIFACT_BASE = '/wasm/blender';
const MODULE_FACTORY_NAME = 'CreateBlenderBlenlibModule';

type BlenlibModuleFactory = (config: Partial<BlenlibModule>) => Promise<BlenlibModule>;

class BlenderBlenlibRuntime {
  private instance: BlenlibModule | null = null;
  private loading = false;

  /**
   * Load the blenlib runtime module.
   */
  async load(): Promise<BlenlibModule> {
    if (this.instance) {
      return this.instance;
    }

    if (this.loading) {
      throw new Error('Blenlib runtime is already loading');
    }

    this.loading = true;

    try {
      const blenderJsUrl = `${ARTIFACT_BASE}/blender_blenlib.js`;
      const ModuleFactory = await this.loadModuleFactory(blenderJsUrl);
      const module = await ModuleFactory(this.createModuleConfig());
      this.assertExports(module);
      this.instance = module;
      return module;
    } finally {
      this.loading = false;
    }
  }

  private createModuleConfig(): Partial<BlenlibModule> {
    return {
      locateFile: (filename: string) => `${ARTIFACT_BASE}/${filename}`,
      print: (message: string) => {
        console.log(`[Blenlib] ${message}`);
      },
      printErr: (message: string) => {
        console.error(`[Blenlib] ${message}`);
      },
      noInitialRun: true,
    };
  }

  private loadModuleFactory(blenderJsUrl: string): Promise<BlenlibModuleFactory> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = blenderJsUrl;
      script.async = true;

      script.onload = () => {
        const factory = (globalThis as Record<string, unknown>)[MODULE_FACTORY_NAME];
        if (typeof factory === 'function') {
          resolve(factory as BlenlibModuleFactory);
          return;
        }
        reject(new Error(
          `Module factory ${MODULE_FACTORY_NAME} not found. ` +
          `Build with -sMODULARIZE=1 -sEXPORT_NAME=${MODULE_FACTORY_NAME}.`
        ));
      };

      script.onerror = () => {
        reject(new Error(
          `Failed to load blenlib JS loader from ${blenderJsUrl}.`
        ));
      };

      document.head.appendChild(script);
    });
  }

  private assertExports(module: BlenlibModule): void {
    const missing = [
      ['_bw_blenlib_capabilities_json', module._bw_blenlib_capabilities_json],
      ['_bw_blenlib_smoke_test', module._bw_blenlib_smoke_test],
      ['_bw_hash_string_mm2a', module._bw_hash_string_mm2a],
      ['UTF8ToString', module.UTF8ToString],
      ['stringToUTF8', module.stringToUTF8],
      ['_malloc', module._malloc],
      ['_free', module._free],
    ].filter(([, value]) => typeof value !== 'function').map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(
        `Blenlib module is missing exports: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Get capabilities JSON from the blenlib module.
   */
  async getCapabilities(): Promise<BlenlibCapabilities | null> {
    if (!this.instance) {
      return null;
    }

    try {
      const module = this.instance;
      if (module._bw_blenlib_capabilities_json) {
        const jsonPtr = module._bw_blenlib_capabilities_json();
        if (jsonPtr && module.UTF8ToString) {
          const jsonStr = module.UTF8ToString(jsonPtr);
          return JSON.parse(jsonStr) as BlenlibCapabilities;
        }
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Run smoke test on the blenlib module.
   * Returns true if successful.
   */
  async runSmokeTest(): Promise<boolean> {
    if (!this.instance) {
      return false;
    }

    try {
      const module = this.instance;
      if (module._bw_blenlib_smoke_test) {
        const result = module._bw_blenlib_smoke_test();
        return result === 1;
      }
    } catch {
      // Ignore errors
    }
    return false;
  }

  /**
   * Hash a string using the MM2A hash algorithm.
   * Returns a 32-bit unsigned hash value.
   */
  async hashStringMm2a(value: string): Promise<number> {
    if (!this.instance) {
      throw new Error('Blenlib runtime not loaded');
    }

    const module = this.instance;
    if (!module._bw_hash_string_mm2a || !module._malloc || !module._free || !module.stringToUTF8) {
      throw new Error('Hash function not available');
    }

    const byteLength = new TextEncoder().encode(value).length + 1;
    const strPtr = module._malloc(byteLength);
    if (!strPtr) {
      throw new Error('Failed to allocate string');
    }

    try {
      module.stringToUTF8(value, strPtr, byteLength);
      const hash = module._bw_hash_string_mm2a(strPtr);
      return hash >>> 0; // Convert to unsigned
    } finally {
      module._free(strPtr);
    }
  }

  /**
   * Check if the runtime is loaded.
   */
  isLoaded(): boolean {
    return this.instance !== null;
  }

  /**
   * Dispose of the runtime.
   */
  async dispose(): Promise<void> {
    if (this.instance) {
      const module = this.instance as Record<string, unknown>;
      if (typeof module.quit === 'function') {
        module.quit();
      }
      this.instance = null;
    }
  }
}

// Singleton instance
export const blenlibRuntime = new BlenderBlenlibRuntime();
