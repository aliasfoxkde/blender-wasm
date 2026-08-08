import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HardwareProfiler } from './HardwareProfiler';

describe('HardwareProfiler', () => {
  let profiler: HardwareProfiler;

  beforeEach(() => {
    vi.clearAllMocks();
    profiler = new HardwareProfiler();
  });

  describe('profile', () => {
    it('should return a capability profile', async () => {
      const profile = await profiler.profile();

      expect(profile).toBeDefined();
      expect(profile.cpu).toBeDefined();
      expect(profile.gpu).toBeDefined();
      expect(profile.memory).toBeDefined();
      expect(profile.features).toBeDefined();
      expect(profile.browser).toBeDefined();
      expect(profile.storage).toBeDefined();
      expect(profile.network).toBeDefined();
    });

    it('should have valid CPU info', async () => {
      const profile = await profiler.profile();

      expect(profile.cpu.cores).toBeGreaterThan(0);
      expect(profile.cpu.threads).toBeGreaterThan(0);
      expect(typeof profile.cpu.model).toBe('string');
    });

    it('should have valid GPU info', async () => {
      const profile = await profiler.profile();

      expect(profile.gpu).toBeDefined();
      expect(typeof profile.gpu.webgpu).toBe('boolean');
      expect(typeof profile.gpu.webgl).toBe('boolean');
    });

    it('should have valid features', async () => {
      const profile = await profiler.profile();

      expect(typeof profile.features.simd).toBe('boolean');
      expect(typeof profile.features.threads).toBe('boolean');
      expect(typeof profile.features.memory64).toBe('boolean');
      expect(typeof profile.features.wasm).toBe('boolean');
    });

    it('should have valid browser info', async () => {
      const profile = await profiler.profile();

      expect(typeof profile.browser.name).toBe('string');
      expect(typeof profile.browser.version).toBe('string');
    });

    it('should have valid storage info', async () => {
      const profile = await profiler.profile();

      expect(typeof profile.storage.quotaMB).toBe('number');
      expect(typeof profile.storage.availableMB).toBe('number');
    });

    it('should have valid network info', async () => {
      const profile = await profiler.profile();

      expect(typeof profile.network.online).toBe('boolean');
      expect(typeof profile.network.effectiveType).toBe('string');
    });
  });
});
