import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsStorage } from './SettingsStorage';

describe('SettingsStorage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset storage state
    await settingsStorage.reset();
  });

  describe('get', () => {
    it('should return default settings', async () => {
      const settings = await settingsStorage.get();
      expect(settings.graphicsQuality).toBe('high');
      expect(settings.preferredRenderer).toBe('auto');
      expect(settings.theme).toBe('dark');
    });
  });

  describe('set', () => {
    it('should update a setting', async () => {
      await settingsStorage.set({ graphicsQuality: 'low' });
      const settings = await settingsStorage.get();
      expect(settings.graphicsQuality).toBe('low');
    });

    it('should preserve other settings', async () => {
      await settingsStorage.set({ graphicsQuality: 'low' });
      const settings = await settingsStorage.get();
      expect(settings.theme).toBe('dark'); // Default
    });

    it('should notify listeners', async () => {
      const callback = vi.fn();
      settingsStorage.onChange(callback);
      await settingsStorage.set({ graphicsQuality: 'low' });
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset to defaults', async () => {
      await settingsStorage.set({ graphicsQuality: 'ultra' });
      await settingsStorage.reset();
      const settings = await settingsStorage.get();
      expect(settings.graphicsQuality).toBe('high');
    });
  });

  describe('onChange', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = settingsStorage.onChange(callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('exportSettings', () => {
    it('should export settings as JSON', async () => {
      const json = await settingsStorage.exportSettings();
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
      await settingsStorage.importSettings(importData);
      const settings = await settingsStorage.get();
      expect(settings.graphicsQuality).toBe('ultra');
    });
  });
});
