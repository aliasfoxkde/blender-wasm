import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsStorage } from './SettingsStorage';

describe('SettingsStorage', () => {
  let storage: SettingsStorage;

  beforeEach(async () => {
    storage = new SettingsStorage();
    // Clear localStorage mock
    vi.clearAllMocks();
    // Reset storage state
    await storage.reset();
  });

  describe('get', () => {
    it('should return default settings', async () => {
      const settings = await storage.get();
      expect(settings.graphicsQuality).toBe('high');
      expect(settings.preferredRenderer).toBe('auto');
      expect(settings.theme).toBe('dark');
    });
  });

  describe('set', () => {
    it('should update a setting', async () => {
      await storage.set({ graphicsQuality: 'low' });
      const settings = await storage.get();
      expect(settings.graphicsQuality).toBe('low');
    });

    it('should preserve other settings', async () => {
      await storage.set({ graphicsQuality: 'low' });
      const settings = await storage.get();
      expect(settings.theme).toBe('dark'); // Default
    });

    it('should notify listeners', async () => {
      const callback = vi.fn();
      storage.onChange(callback);
      await storage.set({ graphicsQuality: 'low' });
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset to defaults', async () => {
      await storage.set({ graphicsQuality: 'ultra' });
      await storage.reset();
      const settings = await storage.get();
      expect(settings.graphicsQuality).toBe('high');
    });
  });

  describe('onChange', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = storage.onChange(callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('exportSettings', () => {
    it('should export settings as JSON', async () => {
      const json = await storage.exportSettings();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.graphicsQuality).toBe('high');
    });
  });

  describe('importSettings', () => {
    it('should import settings from JSON', async () => {
      const importData = JSON.stringify({
        graphicsQuality: 'ultra',
        theme: 'light',
      });
      await storage.importSettings(importData);
      const settings = await storage.get();
      expect(settings.graphicsQuality).toBe('ultra');
    });
  });
});
