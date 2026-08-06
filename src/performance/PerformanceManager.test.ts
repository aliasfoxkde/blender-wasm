import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performanceManager } from './PerformanceManager';

describe('PerformanceManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMetrics', () => {
    it('should return initial metrics', () => {
      const metrics = performanceManager.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.frameTime).toBe('number');
    });
  });

  describe('onMetricsUpdate', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = performanceManager.onMetricsUpdate(callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('getPresets', () => {
    it('should return all presets', () => {
      const presets = performanceManager.getPresets();
      expect(presets).toBeDefined();
      expect(presets.low).toBeDefined();
      expect(presets.medium).toBeDefined();
      expect(presets.high).toBeDefined();
      expect(presets.ultra).toBeDefined();
    });

    it('each preset should have required fields', () => {
      const presets = performanceManager.getPresets();
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
      const profile = await performanceManager.autoDetect();
      expect(profile).toBeDefined();
      expect(profile.name).toMatch(/^(low|medium|high|ultra)$/);
      expect(profile.settings).toBeDefined();
    });
  });

  describe('optimize', () => {
    it('should not throw', async () => {
      await expect(performanceManager.optimize()).resolves.not.toThrow();
    });
  });

  describe('requestMemory', () => {
    it('should return boolean', () => {
      const result = performanceManager.requestMemory(1024);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('garbageCollect', () => {
    it('should not throw', () => {
      expect(() => performanceManager.garbageCollect()).not.toThrow();
    });
  });
});
