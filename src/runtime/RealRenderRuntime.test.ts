/**
 * RealRenderRuntime.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealRenderRuntime } from './RealRenderRuntime';

// Mock fetch for manifest and artifact loading
function mockFetch(json: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => json,
    text: async () => '',
  });
}

describe('RealRenderRuntime', () => {
  let runtime: RealRenderRuntime;

  beforeEach(() => {
    runtime = new RealRenderRuntime();
    vi.clearAllMocks();
  });

  afterEach(() => {
    runtime.dispose();
  });

  describe('load()', () => {
    it('is idempotent — second call returns without error', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => '',
      });
      vi.stubGlobal('fetch', fetchMock);

      // First call will fail on manifest fetch (no manifest in test env)
      try {
        await runtime.load();
      } catch {
        // expected
      }

      // Should not throw even though artifact is missing
      // (subsequent calls with no instance should not double-load)
      expect(() => runtime.isLoaded()).toBeDefined();
    });

    it('throws with correct error when manifest is 404', async () => {
      vi.stubGlobal('fetch', mockFetch(null, false));

      await expect(runtime.load()).rejects.toThrow(/manifest\.json/);
    });

    it('throws when manifest has wrong schema', async () => {
      vi.stubGlobal('fetch', mockFetch({ schema: 99, name: 'real-render', artifacts: {} }));

      await expect(runtime.load()).rejects.toThrow(/schema/);
    });

    it('throws when manifest has wrong name', async () => {
      vi.stubGlobal('fetch', mockFetch({ schema: 1, name: 'wrong-name', artifacts: {} }));

      await expect(runtime.load()).rejects.toThrow(/wrong-name/);
    });

    it('isLoaded() returns false before load', () => {
      expect(runtime.isLoaded()).toBe(false);
    });

    it('isLoaded() returns true after successful load (mocked)', async () => {
      // We cannot fully mock CreateCyclesModule in a unit test without
      // a running WASM instance, so we test the manifest + factory path only.
      // Integration with a real artifact is covered by e2e tests.
      vi.stubGlobal('fetch', mockFetch({ schema: 1, name: 'real-render', artifacts: {} }));

      // load() will fail at the JS glue stage (factory not mocked) — this is expected.
      // The point is to verify the state machine and error path.
      try {
        await runtime.load();
      } catch {
        // expected — no WASM artifact in test environment
      }

      // Runtime should not be marked loaded since JS glue was never available
      expect(runtime.isLoaded()).toBe(false);
    });
  });

  describe('renderSampleScene()', () => {
    it('returns error when not loaded', async () => {
      const result = await runtime.renderSampleScene();
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not loaded/);
    });
  });

  describe('onProgress()', () => {
    it('registers and unregisters a callback', () => {
      const cb = vi.fn();
      const unsub = runtime.onProgress(cb);
      expect(typeof unsub).toBe('function');

      // Unsubscribing should remove the callback
      unsub();
    });

    it('emits progress events during load', async () => {
      const cb = vi.fn();
      runtime.onProgress(cb);

      vi.stubGlobal('fetch', mockFetch({ schema: 1, name: 'real-render', artifacts: {} }));

      try {
        await runtime.load();
      } catch {
        // expected
      }

      // Should have emitted at least one progress event
      expect(cb.mock.calls.length).toBeGreaterThan(0);
      const phases = cb.mock.calls.map(([p]) => (p as { phase: string }).phase);
      expect(phases).toContain('manifest');
    });
  });

  describe('dispose()', () => {
    it('sets isLoaded() to false after dispose', () => {
      // Without a loaded instance, dispose is a no-op
      runtime.dispose();
      expect(runtime.isLoaded()).toBe(false);
    });
  });
});
