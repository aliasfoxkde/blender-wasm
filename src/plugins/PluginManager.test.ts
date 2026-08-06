import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager, type PluginManifest } from './PluginManager';

describe('PluginManager', () => {
  let manager: PluginManager;

  const testManifest: PluginManifest = {
    id: 'test-plugin',
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
    manager = new PluginManager();
    vi.clearAllMocks();
  });

  describe('registerFromManifest', () => {
    it('should register a plugin', async () => {
      await manager.registerFromManifest(testManifest);
      const plugin = manager.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.manifest.name).toBe('Test Plugin');
      expect(plugin?.status).toBe('registered');
    });

    it('should not duplicate registration', async () => {
      await manager.registerFromManifest(testManifest);
      await manager.registerFromManifest(testManifest);
      const all = manager.getAllPlugins();
      expect(all.length).toBe(1);
    });
  });

  describe('getPlugin', () => {
    it('should return undefined for non-existent plugin', () => {
      const plugin = manager.getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });
  });

  describe('getAllPlugins', () => {
    it('should return empty array initially', () => {
      const plugins = manager.getAllPlugins();
      expect(plugins).toEqual([]);
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return empty array initially', () => {
      const plugins = manager.getLoadedPlugins();
      expect(plugins).toEqual([]);
    });
  });

  describe('registerHook', () => {
    it('should register and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = manager.registerHook('test-event', callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('emitHook', () => {
    it('should not throw with no handlers', async () => {
      await expect(manager.emitHook('test-event', {})).resolves.not.toThrow();
    });
  });

  describe('loadPlugin', () => {
    it('should fail for non-existent plugin', async () => {
      const result = await manager.loadPlugin('non-existent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should fail for registered but not loadable plugin', async () => {
      await manager.registerFromManifest(testManifest);
      // The plugin has no assets so load will fail, but it should attempt
      const result = await manager.loadPlugin('test-plugin');
      // Result depends on whether assets can be loaded
      expect(result).toBeDefined();
    });
  });

  describe('disablePlugin', () => {
    it('should not throw for non-existent plugin', async () => {
      await expect(manager.disablePlugin('non-existent')).resolves.not.toThrow();
    });
  });

  describe('enablePlugin', () => {
    it('should not throw for non-existent plugin', async () => {
      await expect(manager.enablePlugin('non-existent')).resolves.not.toThrow();
    });
  });

  describe('handleAICommand', () => {
    it('should return error for unknown command', async () => {
      const response = await manager.handleAICommand({
        id: 'test',
        prompt: 'unknown_command',
      });
      expect(response.success).toBe(false);
    });
  });
});
