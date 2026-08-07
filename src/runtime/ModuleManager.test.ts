import { describe, it, expect, vi, beforeEach } from 'vitest';
import { moduleManager } from './ModuleManager';

describe('ModuleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getState', () => {
    it('should return initial state', () => {
      const state = moduleManager.getState();
      expect(state.loadedModules).toEqual([]);
      expect(state.loadingModules).toEqual([]);
      expect(state.availableModules.length).toBeGreaterThan(0);
      expect(state.totalMemoryUsed).toBe(0);
    });
  });

  describe('onStateChange', () => {
    it('should call callback on state change', () => {
      const callback = vi.fn();
      const unsubscribe = moduleManager.onStateChange(callback);

      // State changes should trigger callback
      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('isLoaded', () => {
    it('should return false for blender module initially', () => {
      // Blender module is registered but not loaded until explicitly loaded
      expect(moduleManager.isLoaded('blender')).toBe(false);
    });

    it('should return false for non-existent module', () => {
      expect(moduleManager.isLoaded('non-existent')).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return false initially', () => {
      expect(moduleManager.isLoading('blender')).toBe(false);
    });
  });

  describe('getModule', () => {
    it('should return module info for registered module', () => {
      const module = moduleManager.getModule('blender');
      expect(module).toBeDefined();
      expect(module?.id).toBe('blender');
    });

    it('should return undefined for non-existent module', () => {
      const module = moduleManager.getModule('non-existent');
      expect(module).toBeUndefined();
    });
  });

  describe('getUnmetDependencies', () => {
    it('should return empty for blender module with no dependencies', () => {
      const deps = moduleManager.getUnmetDependencies('blender');
      expect(deps).toEqual([]);
    });

    it('should return empty for non-existent module', () => {
      const deps = moduleManager.getUnmetDependencies('non-existent');
      expect(deps).toEqual([]);
    });
  });

  describe('getRecommendedModules', () => {
    it('should return blender as the only recommended module', () => {
      const recommended = moduleManager.getRecommendedModules();
      expect(recommended).toEqual(['blender']);
    });
  });

  describe('suggestModules', () => {
    it('should return blender for any action', () => {
      // All actions now load the single blender artifact
      const suggested = moduleManager.suggestModules('start_sculpting');
      expect(suggested).toEqual(['blender']);
    });

    it('should return blender for unknown action', () => {
      const suggested = moduleManager.suggestModules('unknown_action');
      expect(suggested).toEqual(['blender']);
    });
  });
});
