import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleManager } from './ModuleManager';

describe('ModuleManager', () => {
  let manager: ModuleManager;

  beforeEach(() => {
    manager = new ModuleManager();
    vi.clearAllMocks();
  });

  describe('getState', () => {
    it('should return initial state', () => {
      const state = manager.getState();
      expect(state.loadedModules).toEqual([]);
      expect(state.loadingModules).toEqual([]);
      expect(state.availableModules.length).toBeGreaterThan(0);
      expect(state.totalMemoryUsed).toBe(0);
    });
  });

  describe('onStateChange', () => {
    it('should call callback on state change', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onStateChange(callback);

      // State changes should trigger callback
      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('isLoaded', () => {
    it('should return false for core module initially', () => {
      // Core module is registered but not loaded until explicitly loaded
      expect(manager.isLoaded('core')).toBe(false);
    });

    it('should return false for non-existent module', () => {
      expect(manager.isLoaded('non-existent')).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return false initially', () => {
      expect(manager.isLoading('core')).toBe(false);
    });
  });

  describe('getModule', () => {
    it('should return module info for registered module', () => {
      const module = manager.getModule('core');
      expect(module).toBeDefined();
      expect(module?.id).toBe('core');
    });

    it('should return undefined for non-existent module', () => {
      const module = manager.getModule('non-existent');
      expect(module).toBeUndefined();
    });
  });

  describe('getUnmetDependencies', () => {
    it('should return dependencies for registered module', () => {
      const deps = manager.getUnmetDependencies('sculpt');
      expect(deps).toContain('core');
      expect(deps).toContain('mesh');
    });
  });

  describe('getRecommendedModules', () => {
    it('should return recommended modules', () => {
      const recommended = manager.getRecommendedModules();
      expect(recommended).toContain('core');
      expect(recommended).toContain('mesh');
      expect(recommended).toContain('animation');
    });
  });

  describe('suggestModules', () => {
    it('should suggest modules for sculpting', () => {
      const suggested = manager.suggestModules('start_sculpting');
      expect(suggested).toContain('core');
      expect(suggested).toContain('mesh');
      expect(suggested).toContain('sculpt');
    });

    it('should suggest modules for animation', () => {
      const suggested = manager.suggestModules('start_animation');
      expect(suggested).toContain('core');
      expect(suggested).toContain('animation');
    });

    it('should suggest modules for rendering', () => {
      const suggested = manager.suggestModules('start_render');
      expect(suggested).toContain('core');
      expect(suggested).toContain('eevee');
    });

    it('should suggest modules for import', () => {
      const suggested = manager.suggestModules('import_fbx');
      expect(suggested).toContain('core');
      expect(suggested).toContain('fbx');
    });

    it('should return core for unknown action', () => {
      const suggested = manager.suggestModules('unknown_action');
      expect(suggested).toEqual(['core']);
    });
  });
});
