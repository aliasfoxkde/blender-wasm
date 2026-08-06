/**
 * Blender Web Edition Enhancements
 *
 * Phase 12 brings together all previous phases into a cohesive
 * web-native Blender experience.
 */

import { moduleRegistry } from '../runtime/ModuleRegistry';
import { aiGateway } from '../ai/AIGateway';
import { aiService } from '../ai/AIService';
import { collaborationManager } from '../collaboration/CollaborationManager';
import { pluginManager } from '../plugins/PluginManager';
import { performanceManager } from '../performance/PerformanceManager';

export interface BlenderWebEdition {
  version: string;
  modules: typeof moduleRegistry;
  ai: typeof aiGateway;
  collaboration: typeof collaborationManager;
  plugins: typeof pluginManager;
  performance: typeof performanceManager;
}

class BlenderWebEditionApp {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    console.log('Initializing Blender Web Edition...');

    // Initialize performance monitoring
    await performanceManager.init();
    performanceManager.startMonitoring();

    // Initialize plugins
    const { registerBuiltinPlugins } = await import('../plugins/PluginRegistry');
    await registerBuiltinPlugins();

    // Connect to collaboration if enabled
    await collaborationManager.connect();

    // Configure AI service
    aiService.configure({ provider: 'mock' });

    this.initialized = true;
    console.log('Blender Web Edition ready!');
  }

  getAPI(): BlenderWebEdition {
    return {
      version: '0.1.0',
      modules: moduleRegistry,
      ai: aiGateway,
      collaboration: collaborationManager,
      plugins: pluginManager,
      performance: performanceManager,
    };
  }

  // Quick actions for common workflows
  async quickAdd(type: 'cube' | 'sphere' | 'plane' | 'cylinder'): Promise<void> {
    await aiGateway.executeNaturalLanguage(`add ${type}`);
  }

  async quickRender(): Promise<void> {
    await aiGateway.executeNaturalLanguage('render scene');
  }

  async quickSave(name: string): Promise<void> {
    await aiGateway.executeNaturalLanguage(`save project as ${name}`);
  }

  // Diagnostic info
  getInfo(): Record<string, unknown> {
    return {
      version: '0.1.0',
      initialized: this.initialized,
      modules: {
        total: moduleRegistry.getAll().length,
        loaded: moduleRegistry.getLoaded().map(m => m.id),
      },
      plugins: {
        total: pluginManager.getAllPlugins().length,
        active: pluginManager.getLoadedPlugins().map(p => p.manifest.id),
      },
      performance: performanceManager.getMetrics(),
    };
  }
}

export const blenderWeb = new BlenderWebEditionApp();
