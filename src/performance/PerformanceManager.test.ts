import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceManager } from './PerformanceManager';

describe('PerformanceManager', () => {
  let manager: PerformanceManager;

  beforeEach(() => {
    manager = new PerformanceManager();
    vi.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return initial metrics', () => {
      const metrics = manager.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.frameTime).toBe('number');
    });
  });

  describe('onMetricsUpdate', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onMetricsUpdate(callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('getPresets', () => {
    it('should return all presets', () => {
      const presets = manager.getPresets();
      expect(presets).toBeDefined();
      expect(presets.low).toBeDefined();
      expect(presets.medium).toBeDefined();
      expect(presets.high).toBeDefined();
      expect(presets.ultra).toBeDefined();
    });

    it('each preset should have required fields', () => {
      const presets = manager.getPresets();
      for (const preset of Object.values(presets)) {
        expect(preset.graphicsQuality).toBeDefined();
        expect(preset.enableSIMD).toBeDefined();
        expect(preset.enableThreads).toBeDefined();
        expect(preset.maxMemoryMB).toBeDefined();
      }
    });
  });

  describe('autoDetect', () => {
    it('should return a preset based on hardware', async () => {
      const profile = await manager.autoDetect();
      expect(profile).toBeDefined();
      expect(profile.name).toBeOneOf(['low', 'medium', 'high', 'ultra']);
      expect(profile.settings).toBeDefined();
    });
  });

  describe('optimize', () => {
    it('should not throw', async () => {
      await expect(manager.optimize()).resolves.not.toThrow();
    });
  });

  describe('requestMemory', () => {
    it('should return boolean', () => {
      const result = manager.requestMemory(1024);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('garbageCollect', () => {
    it('should not throw', () => {
      expect(() => manager.garbageCollect()).not.toThrow();
    });
  });
});
