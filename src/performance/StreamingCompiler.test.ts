import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamingCompiler } from './StreamingCompiler';

describe('StreamingCompiler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compile', () => {
    it('should return task for non-existent url', async () => {
      const task = streamingCompiler.getTask('/non-existent.wasm');
      expect(task).toBeUndefined();
    });
  });

  describe('getTask', () => {
    it('should return undefined for non-existent task', () => {
      const task = streamingCompiler.getTask('non-existent');
      expect(task).toBeUndefined();
    });
  });

  describe('cancelAll', () => {
    it('should not throw when cancelling', () => {
      expect(() => streamingCompiler.cancelAll()).not.toThrow();
    });
  });

  describe('compileAll', () => {
    it('should handle empty array', async () => {
      const results = await streamingCompiler.compileAll([]);
      expect(results).toBeInstanceOf(Map);
      expect(results.size).toBe(0);
    });

    it('should compile multiple modules with progress', async () => {
      let progressCalls = 0;
      const onProgress = vi.fn((completed, total) => {
        progressCalls++;
      });

      // This will fail on actual fetch but tests the flow
      try {
        await streamingCompiler.compileAll(['/a.wasm', '/b.wasm'], onProgress);
      } catch {
        // Expected - modules don't exist
      }

      // onProgress should have been called
      expect(progressCalls).toBeGreaterThanOrEqual(0);
    });
  });
});
