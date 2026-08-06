import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pluginManager, type PluginManifest } from './PluginManager';

describe('PluginManager', () => {
  const testManifest: PluginManifest = {
    id: 'test-plugin-' + Date.now(),
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin',
    author: 'Test',
    permissions: [
      { type: 'filesystem', access: 'read' },
      { type: 'scene', access: 'write' },
    ],
    entrypoint: '/plugins/test/index.js',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerFromManifest', () => {
    it('should register a plugin', async () => {
      await pluginManager.registerFromManifest(testManifest);
      const plugin = pluginManager.getPlugin(testManifest.id);
      expect(plugin).toBeDefined();
      expect(plugin?.manifest.name).toBe('Test Plugin');
      expect(plugin?.status).toBe('registered');
    });

    it('should not duplicate registration', async () => {
      await pluginManager.registerFromManifest(testManifest);
      await pluginManager.registerFromManifest(testManifest);
      const all = pluginManager.getAllPlugins();
      const matches = all.filter(p => p.manifest.id === testManifest.id);
      expect(matches.length).toBe(1);
    });
  });

  describe('getPlugin', () => {
    it('should return undefined for non-existent plugin', () => {
      const plugin = pluginManager.getPlugin('non-existent-' + Date.now());
      expect(plugin).toBeUndefined();
    });
  });

  describe('getAllPlugins', () => {
    it('should return all registered plugins', () => {
      const plugins = pluginManager.getAllPlugins();
      expect(Array.isArray(plugins)).toBe(true);
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return empty array initially', () => {
      const plugins = pluginManager.getLoadedPlugins();
      expect(plugins).toEqual([]);
    });
  });

  describe('registerHook', () => {
    it('should register and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = pluginManager.registerHook('test-event-' + Date.now(), callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('emitHook', () => {
    it('should not throw with no handlers', async () => {
      await expect(pluginManager.emitHook('test-event', {})).resolves.not.toThrow();
    });
  });

  describe('loadPlugin', () => {
    it('should fail for non-existent plugin', async () => {
      const result = await pluginManager.loadPlugin('non-existent-' + Date.now());
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('disablePlugin', () => {
    it('should not throw for non-existent plugin', async () => {
      await expect(pluginManager.disablePlugin('non-existent-' + Date.now())).resolves.not.toThrow();
    });
  });

  describe('enablePlugin', () => {
    it('should not throw for non-existent plugin', async () => {
      await expect(pluginManager.enablePlugin('non-existent-' + Date.now())).resolves.not.toThrow();
    });
  });

  describe('handleAICommand', () => {
    it('should return error for unknown command', async () => {
      const response = await pluginManager.handleAICommand({
        id: 'test',
        prompt: 'unknown_command',
      });
      expect(response.success).toBe(false);
    });
  });
});
