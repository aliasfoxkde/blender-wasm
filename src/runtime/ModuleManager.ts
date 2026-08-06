/**
 * Module Manager - High-level API for WASM module management
 */

import { wasmLoader, type LoaderProgress } from './WASMLoader';
import { moduleRegistry, type ModuleInfo } from './ModuleRegistry';

export interface ModuleManagerState {
  loadedModules: ModuleInfo[];
  loadingModules: string[];
  availableModules: ModuleInfo[];
  totalMemoryUsed: number;
}

type StateChangeCallback = (state: ModuleManagerState) => void;

class ModuleManager {
  private stateChangeCallbacks: Set<StateChangeCallback> = new Set();
  private prefetchQueue: string[] = [];
  private prefetchInProgress = false;

  getState(): ModuleManagerState {
    return {
      loadedModules: moduleRegistry.getLoaded(),
      loadingModules: moduleRegistry.getAll()
        .filter((m) => m.loading)
        .map((m) => m.id),
      availableModules: moduleRegistry.getAll(),
      totalMemoryUsed: wasmLoader.getTotalMemoryUsed(),
    };
  }

  onStateChange(callback: StateChangeCallback): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeCallbacks.forEach((cb) => cb(state));
  }

  async load(
    moduleId: string,
    options?: { forceReload?: boolean; onProgress?: (progress: LoaderProgress) => void }
  ): Promise<void> {
    if (options?.onProgress) {
      const unsubscribe = wasmLoader.onProgress(options.onProgress);
      try {
        await wasmLoader.loadModule(moduleId, options);
      } finally {
        unsubscribe();
      }
    } else {
      await wasmLoader.loadModule(moduleId, options);
    }
    this.notifyStateChange();
  }

  async loadMultiple(moduleIds: string[]): Promise<void> {
    await Promise.all(moduleIds.map((id) => this.load(id)));
    this.notifyStateChange();
  }

  unload(moduleId: string): void {
    wasmLoader.unloadModule(moduleId);
    this.notifyStateChange();
  }

  prefetch(moduleIds: string[]): void {
    this.prefetchQueue.push(...moduleIds);
    this.processPrefetchQueue();
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.prefetchInProgress || this.prefetchQueue.length === 0) {
      return;
    }

    this.prefetchInProgress = true;

    while (this.prefetchQueue.length > 0) {
      // Take the next module from the queue
      const moduleId = this.prefetchQueue.shift()!;

      // Skip if already loaded or loading
      if (moduleRegistry.isLoaded(moduleId) || moduleRegistry.isLoading(moduleId)) {
        continue;
      }

      // Prefetch in the background
      this.load(moduleId).catch(() => {
        // Silently ignore prefetch errors
      });

      // Yield to allow other operations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.prefetchInProgress = false;
  }

  isLoaded(moduleId: string): boolean {
    return moduleRegistry.isLoaded(moduleId);
  }

  isLoading(moduleId: string): boolean {
    return moduleRegistry.isLoading(moduleId);
  }

  getModule(moduleId: string): ModuleInfo | undefined {
    return moduleRegistry.get(moduleId);
  }

  getUnmetDependencies(moduleId: string): string[] {
    return moduleRegistry.getUnmetDependencies(moduleId);
  }

  getRecommendedModules(): string[] {
    // Return recommended modules based on current usage patterns
    // For now, just return core + commonly used modules
    return ['core', 'mesh', 'animation'];
  }

  // Suggest modules to preload based on user behavior
  suggestModules(action: string): string[] {
    switch (action) {
      case 'start_sculpting':
        return ['core', 'mesh', 'sculpt'];
      case 'start_animation':
        return ['core', 'animation'];
      case 'start_render':
        return ['core', 'eevee']; // or 'cycles'
      case 'import_fbx':
        return ['core', 'fbx'];
      case 'import_usd':
        return ['core', 'usd'];
      default:
        return ['core'];
    }
  }
}

export const moduleManager = new ModuleManager();
