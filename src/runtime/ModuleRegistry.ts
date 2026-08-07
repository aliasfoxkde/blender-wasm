/**
 * WASM Module Registry
 * Central registry for all Blender WASM modules with dependency management
 */

export interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  url: string;
  wasmUrl?: string;
  size: number;
  dependencies: string[];
  loaded: boolean;
  loading: boolean;
}

export interface ModuleLoadResult {
  module: unknown;
  info: ModuleInfo;
}

class ModuleRegistry {
  private modules: Map<string, ModuleInfo> = new Map();
  private instances: Map<string, unknown> = new Map();
  private loadingPromises: Map<string, Promise<unknown>> = new Map();

  constructor() {
    this.registerDefaultModules();
  }

  private registerDefaultModules() {
    // Single Blender WASM artifact - produced by Docker build
    // See docs/MVP_EXECUTION_PLAN.md Phase 4 for artifact details
    this.register({
      id: 'blender',
      name: 'Blender WASM',
      version: '1.0.0',
      url: '/wasm/blender/blender.js',
      wasmUrl: '/wasm/blender/blender.wasm',
      size: 0,
      dependencies: [],
    });
  }

  register(info: Omit<ModuleInfo, 'loaded' | 'loading'>): void {
    this.modules.set(info.id, {
      ...info,
      loaded: false,
      loading: false,
    });
  }

  get(id: string): ModuleInfo | undefined {
    return this.modules.get(id);
  }

  getAll(): ModuleInfo[] {
    return Array.from(this.modules.values());
  }

  getLoaded(): ModuleInfo[] {
    return this.getAll().filter((m) => m.loaded);
  }

  isLoaded(id: string): boolean {
    return this.modules.get(id)?.loaded ?? false;
  }

  isLoading(id: string): boolean {
    return this.modules.get(id)?.loading ?? false;
  }

  getUnmetDependencies(id: string): string[] {
    const module = this.modules.get(id);
    if (!module) return [];

    return module.dependencies.filter((depId) => !this.isLoaded(depId));
  }

  getLoadOrder(id: string): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (moduleId: string) => {
      if (visited.has(moduleId)) return;
      visited.add(moduleId);

      const module = this.modules.get(moduleId);
      if (!module) return;

      for (const depId of module.dependencies) {
        visit(depId);
      }

      order.push(moduleId);
    };

    visit(id);
    return order;
  }
}

export const moduleRegistry = new ModuleRegistry();
