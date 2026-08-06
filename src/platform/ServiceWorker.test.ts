import { describe, it, expect, vi, beforeEach } from 'vitest';
import { serviceWorkerManager } from './ServiceWorker';

describe('ServiceWorkerManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRegistration', () => {
    it('should return null when not registered', () => {
      const registration = serviceWorkerManager.getRegistration();
      expect(registration).toBeNull();
    });
  });
});
