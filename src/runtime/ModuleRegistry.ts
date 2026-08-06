/**
 * WASM Module Registry
 * Central registry for all Blender WASM modules with dependency management
 */

export interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  url: string;
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
    // Core Blender modules
    this.register({
      id: 'core',
      name: 'Blender Core',
      version: '1.0.0',
      url: '/wasm/blender_core.wasm',
      size: 0, // Will be determined at load time
      dependencies: [],
    });

    // Optional modules
    this.register({
      id: 'mesh',
      name: 'Mesh System',
      version: '1.0.0',
      url: '/wasm/blender_mesh.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'sculpt',
      name: 'Sculpt Mode',
      version: '1.0.0',
      url: '/wasm/blender_sculpt.wasm',
      size: 0,
      dependencies: ['core', 'mesh'],
    });

    this.register({
      id: 'animation',
      name: 'Animation System',
      version: '1.0.0',
      url: '/wasm/blender_animation.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'physics',
      name: 'Physics Simulation',
      version: '1.0.0',
      url: '/wasm/blender_physics.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'geometry-nodes',
      name: 'Geometry Nodes',
      version: '1.0.0',
      url: '/wasm/blender_geometry_nodes.wasm',
      size: 0,
      dependencies: ['core', 'mesh'],
    });

    this.register({
      id: 'cycles',
      name: 'Cycles Renderer',
      version: '1.0.0',
      url: '/wasm/blender_cycles.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'eevee',
      name: 'Eevee Renderer',
      version: '1.0.0',
      url: '/wasm/blender_eevee.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'python',
      name: 'Python Interpreter',
      version: '1.0.0',
      url: '/wasm/blender_python.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'usd',
      name: 'USD Import/Export',
      version: '1.0.0',
      url: '/wasm/blender_usd.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'fbx',
      name: 'FBX Import/Export',
      version: '1.0.0',
      url: '/wasm/blender_fbx.wasm',
      size: 0,
      dependencies: ['core'],
    });

    this.register({
      id: 'obj',
      name: 'OBJ Import/Export',
      version: '1.0.0',
      url: '/wasm/blender_obj.wasm',
      size: 0,
      dependencies: ['core'],
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
