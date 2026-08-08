import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workerPool } from './WorkerPool';

describe('WorkerPool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return pool statistics', () => {
      const stats = workerPool.getStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('available');
      expect(stats).toHaveProperty('busy');
      expect(stats).toHaveProperty('pending');
    });
  });

  describe('terminate', () => {
    it('should terminate when no workers exist', async () => {
      // terminate should work even if not initialized
      await expect(workerPool.terminate()).resolves.not.toThrow();
    });
  });
});
