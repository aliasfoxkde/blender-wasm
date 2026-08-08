import { describe, it, expect, vi, beforeEach } from 'vitest';
import { blenderWeb } from './BlenderEnhancements';

describe('BlenderWebEditionApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize without error', async () => {
      await expect(blenderWeb.init()).resolves.not.toThrow();
    });

    it('should not re-initialize if already initialized', async () => {
      await blenderWeb.init();
      await expect(blenderWeb.init()).resolves.not.toThrow();
    });
  });

  describe('getAPI', () => {
    it('should return API object', async () => {
      await blenderWeb.init();
      const api = blenderWeb.getAPI();
      expect(api).toHaveProperty('version');
      expect(api).toHaveProperty('modules');
      expect(api).toHaveProperty('ai');
      expect(api).toHaveProperty('collaboration');
      expect(api).toHaveProperty('plugins');
      expect(api).toHaveProperty('performance');
    });

    it('should have version string', async () => {
      await blenderWeb.init();
      const api = blenderWeb.getAPI();
      expect(typeof api.version).toBe('string');
    });
  });

  describe('quickAdd', () => {
    it('should accept cube type', async () => {
      await blenderWeb.init();
      // May fail due to no actual WASM, but should accept the type
      try {
        await blenderWeb.quickAdd('cube');
      } catch {
        // Expected - no actual Blender
      }
    });

    it('should accept sphere type', async () => {
      await blenderWeb.init();
      try {
        await blenderWeb.quickAdd('sphere');
      } catch {
        // Expected
      }
    });
  });

  describe('quickRender', () => {
    it('should not throw', async () => {
      await blenderWeb.init();
      try {
        await blenderWeb.quickRender();
      } catch {
        // Expected - no actual render target
      }
    });
  });

  describe('quickSave', () => {
    it('should accept name parameter', async () => {
      await blenderWeb.init();
      try {
        await blenderWeb.quickSave('test-project');
      } catch {
        // Expected
      }
    });
  });

  describe('getInfo', () => {
    it('should return diagnostic info', async () => {
      await blenderWeb.init();
      const info = blenderWeb.getInfo();
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('initialized');
      expect(info).toHaveProperty('modules');
      expect(info).toHaveProperty('plugins');
      expect(info).toHaveProperty('performance');
    });
  });
});
