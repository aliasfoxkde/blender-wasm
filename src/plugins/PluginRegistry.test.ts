import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerBuiltinPlugins, getBuiltinPluginManifests } from './PluginRegistry';

describe('PluginRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBuiltinPluginManifests', () => {
    it('should return array of builtin manifests', () => {
      const manifests = getBuiltinPluginManifests();
      expect(Array.isArray(manifests)).toBe(true);
      expect(manifests.length).toBeGreaterThan(0);
    });

    it('should have required plugin properties', () => {
      const manifests = getBuiltinPluginManifests();
      for (const manifest of manifests) {
        expect(manifest).toHaveProperty('id');
        expect(manifest).toHaveProperty('name');
        expect(manifest).toHaveProperty('version');
        expect(manifest).toHaveProperty('entrypoint');
        expect(manifest).toHaveProperty('permissions');
      }
    });

    it('should include io-obj plugin', () => {
      const manifests = getBuiltinPluginManifests();
      const obj = manifests.find(m => m.id === 'io-obj');
      expect(obj).toBeDefined();
      expect(obj?.name).toContain('OBJ');
    });

    it('should include ai-assist plugin', () => {
      const manifests = getBuiltinPluginManifests();
      const ai = manifests.find(m => m.id === 'ai-assist');
      expect(ai).toBeDefined();
      expect(ai?.name).toContain('AI');
    });
  });

  describe('registerBuiltinPlugins', () => {
    it('should register all builtin plugins', async () => {
      await registerBuiltinPlugins();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
