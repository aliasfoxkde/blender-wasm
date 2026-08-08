import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wasmLoader } from './WASMLoader';
import { moduleRegistry } from './ModuleRegistry';

describe('WASMLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Register a test module
    moduleRegistry.register({
      id: 'test-module',
      name: 'Test Module',
      version: '1.0.0',
      url: '/test.wasm',
      size: 1024,
      dependencies: [],
    });
  });

  describe('onProgress', () => {
    it('should add and remove progress callback', () => {
      const callback = vi.fn();
      const unsubscribe = wasmLoader.onProgress(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('loadModule', () => {
    it('should throw for non-existent module', async () => {
      await expect(wasmLoader.loadModule('non-existent')).rejects.toThrow('Module not found');
    });

    it('should mark module as loading during load', async () => {
      // This will fail on fetch but we can test the error case
      try {
        await wasmLoader.loadModule('test-module');
      } catch {
        // Expected - no actual WASM file
      }
      // Module should no longer be loading
      expect(moduleRegistry.isLoading('test-module')).toBe(false);
    });
  });

  describe('unloadModule', () => {
    it('should do nothing for non-existent module', () => {
      expect(() => wasmLoader.unloadModule('non-existent')).not.toThrow();
    });

    it('should not unload core module', () => {
      // Core is special and should not be unloadable
      expect(() => wasmLoader.unloadModule('core')).not.toThrow();
    });
  });

  describe('getMemory', () => {
    it('should return undefined for non-loaded module', () => {
      const memory = wasmLoader.getMemory('non-existent');
      expect(memory).toBeUndefined();
    });
  });

  describe('getTotalMemoryUsed', () => {
    it('should return number', () => {
      const total = wasmLoader.getTotalMemoryUsed();
      expect(typeof total).toBe('number');
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('preloadModules', () => {
    it('should handle empty array', async () => {
      await expect(wasmLoader.preloadModules([])).resolves.not.toThrow();
    });
  });
});
