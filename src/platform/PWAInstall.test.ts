import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pwaInstallManager } from './PWAInstall';

describe('PWAInstallManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pwaInstallManager.init();
  });

  describe('init', () => {
    it('should initialize without error', () => {
      expect(() => pwaInstallManager.init()).not.toThrow();
    });
  });

  describe('isInstallable', () => {
    it('should return false initially', () => {
      expect(pwaInstallManager.isInstallable()).toBe(false);
    });
  });

  describe('prompt', () => {
    it('should return unavailable when no prompt', async () => {
      const result = await pwaInstallManager.prompt();
      expect(result).toBe('unavailable');
    });
  });

  describe('onPromptAvailable', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = pwaInstallManager.onPromptAvailable(callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });
});
