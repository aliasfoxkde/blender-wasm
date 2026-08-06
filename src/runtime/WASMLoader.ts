/**
 * WASM Loader - Dynamically loads and manages Blender WASM modules
 */

import { moduleRegistry, type ModuleInfo, type ModuleLoadResult } from './ModuleRegistry';

export interface LoaderProgress {
  moduleId: string;
  progress: number;
  bytesLoaded: number;
  totalBytes: number;
}

export type ProgressCallback = (progress: LoaderProgress) => void;

interface WASMImports {
  env: Record<string, unknown>;
  wasi_snapshot_preview1?: Record<string, unknown>;
  blender?: Record<string, unknown>;
}

interface WASMExports {
  [key: string]: unknown;
}

class WASMLoader {
  private importObject: WASMImports;
  private onProgressCallbacks: Set<ProgressCallback> = new Set();
  private memoryBuffer: Map<string, WebAssembly.Memory> = new Map();

  constructor() {
    this.importObject = this.createImportObject();
  }

  private createImportObject(): WASMImports {
    return {
      env: {
        // Memory
        emscripten_resize_heap: () => 0,
        emscripten_memcpy_js: (dest: number, src: number, len: number) => {
          const memory = this.getActiveMemory();
          if (memory) {
            const view = new Uint8Array(memory.buffer);
            view.copyWithin(dest, src, src + len);
          }
          return dest;
        },

        // Logging
        emscripten_log: (level: number, message: number) => {
          // Forward to console
        },

        // Time
        emscripten_get_now: () => performance.now(),

        // Math
        sqrt: Math.sqrt,
        sin: Math.sin,
        cos: Math.cos,
        pow: Math.pow,
        floor: Math.floor,
        ceil: Math.ceil,
        abs: Math.abs,
        min: Math.min,
        max: Math.max,

        // Memory allocation
        malloc: (size: number) => {
          const memory = this.getActiveMemory();
          if (!memory) return 0;
          const buffer = new Uint8Array(memory.buffer);
          const offset = buffer.length;
          // In a real implementation, we'd track allocations
          return offset;
        },

        free: () => {},

        // Threading (stub for now)
        emscripten_atomics_store_u32: () => 0,
        emscripten_atomics_load_u32: () => 0,
      },
      wasi_snapshot_preview1: {
        fd_write: () => 0,
        fd_close: () => 0,
        fd_seek: () => 0,
      },
      blender: {
        // Blender-specific imports will be added here
        log: (message: string) => console.log(`[Blender] ${message}`),
        error: (message: string) => console.error(`[Blender] ${message}`),
      },
    };
  }

  private getActiveMemory(): WebAssembly.Memory | undefined {
    // Return the most recently created memory
    const memories = Array.from(this.memoryBuffer.values());
    return memories[memories.length - 1];
  }

  onProgress(callback: ProgressCallback): () => void {
    this.onProgressCallbacks.add(callback);
    return () => this.onProgressCallbacks.delete(callback);
  }

  private reportProgress(progress: LoaderProgress): void {
    this.onProgressCallbacks.forEach((cb) => cb(progress));
  }

  async loadModule(
    moduleId: string,
    options?: { forceReload?: boolean }
  ): Promise<ModuleLoadResult> {
    const info = moduleRegistry.get(moduleId);
    if (!info) {
      throw new Error(`Module not found: ${moduleId}`);
    }

    // Return cached instance if already loaded
    if (info.loaded && !options?.forceReload) {
      const instance = moduleRegistry.get(moduleId);
      if (instance) {
        return {
          module: this.memoryBuffer.get(moduleId) || {},
          info: moduleRegistry.get(moduleId)!,
        };
      }
    }

    // If already loading, wait for it
    const existingPromise = moduleRegistry.isLoading(moduleId);
    if (existingPromise) {
      await moduleRegistry.isLoading(moduleId);
    }

    // Check if already have an instance
    const cachedInstance = this.memoryBuffer.get(moduleId);
    if (cachedInstance && !options?.forceReload) {
      return {
        module: cachedInstance,
        info: moduleRegistry.get(moduleId)!,
      };
    }

    // Load dependencies first
    const loadOrder = moduleRegistry.getLoadOrder(moduleId);
    for (const depId of loadOrder) {
      if (depId !== moduleId && !moduleRegistry.isLoaded(depId)) {
        await this.loadModule(depId, options);
      }
    }

    // Mark as loading
    const module = moduleRegistry.get(moduleId);
    if (module) {
      module.loading = true;
    }

    try {
      // In a real implementation, this would fetch and instantiate the WASM module
      // For now, we simulate loading
      const result = await this.fetchAndInstantiate(moduleId, info);

      // Mark as loaded
      if (module) {
        module.loaded = true;
        module.loading = false;
      }

      return result;
    } catch (error) {
      if (module) {
        module.loading = false;
      }
      throw error;
    }
  }

  private async fetchAndInstantiate(
    moduleId: string,
    info: ModuleInfo
  ): Promise<ModuleLoadResult> {
    // Simulate fetching - in production, this would use fetch with progress
    const response = await fetch(info.url, {
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch module ${moduleId}: ${response.statusText}`);
    }

    const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error(`Cannot read module ${moduleId}`);
    }

    const chunks: Uint8Array[] = [];
    let bytesLoaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      bytesLoaded += value.length;

      this.reportProgress({
        moduleId,
        progress: contentLength > 0 ? (bytesLoaded / contentLength) * 100 : 0,
        bytesLoaded,
        totalBytes: contentLength,
      });
    }

    const wasmBytes = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      wasmBytes.set(chunk, offset);
      offset += chunk.length;
    }

    // Instantiate the module
    const memory = new WebAssembly.Memory({
      initial: 256, // 256 pages = 16MB
      maximum: 2048, // 128MB max
      shared: false,
    });
    this.memoryBuffer.set(moduleId, memory);

    const importWithMemory = {
      ...this.importObject,
      env: {
        ...this.importObject.env,
        memory,
      },
    };

    const result = await WebAssembly.instantiate(wasmBytes, importWithMemory);
    const exports = result.instance.exports as WASMExports;

    // Store exports
    this.memoryBuffer.set(moduleId, exports);

    return {
      module: exports,
      info: moduleRegistry.get(moduleId)!,
    };
  }

  async preloadModules(moduleIds: string[]): Promise<void> {
    await Promise.all(moduleIds.map((id) => this.loadModule(id)));
  }

  unloadModule(moduleId: string): void {
    const module = moduleRegistry.get(moduleId);
    if (!module) return;

    // Don't unload core module
    if (moduleId === 'core') return;

    // Check if any loaded modules depend on this one
    const dependents = moduleRegistry.getLoaded().filter((m) =>
      m.dependencies.includes(moduleId)
    );

    if (dependents.length > 0) {
      console.warn(
        `Cannot unload ${moduleId}: ${dependents.map((m) => m.id).join(', ')} depend on it`
      );
      return;
    }

    module.loaded = false;
    this.memoryBuffer.delete(moduleId);
  }

  getMemory(moduleId: string): WebAssembly.Memory | undefined {
    return this.memoryBuffer.get(moduleId);
  }

  getTotalMemoryUsed(): number {
    let total = 0;
    this.memoryBuffer.forEach((memory) => {
      total += memory.buffer.byteLength;
    });
    return total;
  }
}

export const wasmLoader = new WASMLoader();
