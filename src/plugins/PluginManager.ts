/**
 * Plugin System - Web-native extension platform
 */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  assets?: string[];
  entrypoint: string;
  dependencies?: string[];
}

export interface PluginPermission {
  type: 'filesystem' | 'network' | 'scene' | 'ui' | 'ai';
  access: 'read' | 'write' | 'execute';
  resource?: string;
}

export interface Plugin {
  manifest: PluginManifest;
  instance: PluginInstance | null;
  status: 'registered' | 'loading' | 'loaded' | 'error' | 'disabled';
  error?: string;
}

export interface PluginInstance {
  id: string;
  manifest: PluginManifest;
  exports: PluginExports;
  hooks: PluginHooks;
}

export interface PluginExports {
  [key: string]: unknown;
}

export interface PluginHooks {
  onInit?: () => void | Promise<void>;
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onSceneChange?: (event: SceneEvent) => void;
  onAICommand?: (command: AICommand) => void | Promise<AIResponse>;
}

export interface SceneEvent {
  type: 'object_added' | 'object_removed' | 'object_modified' | 'selection_changed';
  payload: unknown;
}

export interface AICommand {
  id: string;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AIResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface PluginLoadResult {
  success: boolean;
  plugin?: Plugin;
  error?: string;
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private hookHandlers: Map<string, Set<(data: unknown) => void>> = new Map();

  async registerFromManifest(manifest: PluginManifest): Promise<void> {
    if (this.plugins.has(manifest.id)) {
      console.warn(`Plugin ${manifest.id} is already registered`);
      return;
    }

    const plugin: Plugin = {
      manifest,
      instance: null,
      status: 'registered',
    };

    this.plugins.set(manifest.id, plugin);
    console.log(`Registered plugin: ${manifest.name} v${manifest.version}`);
  }

  async loadPlugin(pluginId: string): Promise<PluginLoadResult> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { success: false, error: `Plugin ${pluginId} not found` };
    }

    if (plugin.status === 'loaded') {
      return { success: true, plugin };
    }

    plugin.status = 'loading';

    try {
      // Load plugin assets if needed
      if (plugin.manifest.assets?.length) {
        await this.preloadAssets(plugin.manifest.assets);
      }

      // Load the plugin module
      const instance = await this.instantiatePlugin(plugin.manifest);
      plugin.instance = instance;
      plugin.status = 'loaded';
      plugin.error = undefined;

      // Run init hook
      if (instance.hooks.onInit) {
        await instance.hooks.onInit();
      }

      // Run load hook
      if (instance.hooks.onLoad) {
        await instance.hooks.onLoad();
      }

      console.log(`Loaded plugin: ${plugin.manifest.name}`);
      return { success: true, plugin };
    } catch (error) {
      plugin.status = 'error';
      plugin.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to load plugin ${pluginId}:`, error);
      return { success: false, error: plugin.error };
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.instance) return;

    try {
      // Run unload hook
      if (plugin.instance.hooks.onUnload) {
        await plugin.instance.hooks.onUnload();
      }

      plugin.instance = null;
      plugin.status = 'registered';
      console.log(`Unloaded plugin: ${plugin.manifest.name}`);
    } catch (error) {
      console.error(`Error unloading plugin ${pluginId}:`, error);
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    plugin.status = 'registered';
    await this.loadPlugin(pluginId);
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    await this.unloadPlugin(pluginId);
    plugin.status = 'disabled';
  }

  private async preloadAssets(assets: string[]): Promise<void> {
    await Promise.all(
      assets.map((asset) =>
        fetch(asset, { credentials: 'same-origin' }).then((r) => r.blob())
      )
    );
  }

  private async instantiatePlugin(
    manifest: PluginManifest
  ): Promise<PluginInstance> {
    // In production, this would dynamically import the plugin module
    // For now, create a stub instance
    const instance: PluginInstance = {
      id: manifest.id,
      manifest,
      exports: {},
      hooks: {},
    };

    return instance;
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getLoadedPlugins(): Plugin[] {
    return this.getAllPlugins().filter((p) => p.status === 'loaded');
  }

  // Hook system for inter-plugin and core communication
  registerHook(event: string, handler: (data: unknown) => void): () => void {
    if (!this.hookHandlers.has(event)) {
      this.hookHandlers.set(event, new Set());
    }
    this.hookHandlers.get(event)!.add(handler);
    return () => this.hookHandlers.get(event)?.delete(handler);
  }

  async emitHook(event: string, data: unknown): Promise<void> {
    const handlers = this.hookHandlers.get(event);
    if (!handlers) return;

    await Promise.all(
      Array.from(handlers).map((handler) => {
        try {
          return handler(data);
        } catch (error) {
          console.error(`Error in hook handler for ${event}:`, error);
        }
      })
    );
  }

  // For AI commands
  async handleAICommand(command: AICommand): Promise<AIResponse> {
    const loadedPlugins = this.getLoadedPlugins();
    const responses: AIResponse[] = [];

    for (const plugin of loadedPlugins) {
      if (plugin.instance?.hooks.onAICommand) {
        try {
          const response = await plugin.instance.hooks.onAICommand(command);
          if (response && typeof response === 'object' && 'success' in response && response.success) {
            responses.push(response as AIResponse);
          }
        } catch (_error: unknown) {
          // Continue to next plugin
        }
      }
    }

    if (responses.length > 0) {
      return responses[0]; // Return first successful response
    }

    return { success: false, error: 'No plugin handled the command' };
  }
}

export const pluginManager = new PluginManager();
