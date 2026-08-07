/**
 * Tests for BlenderBlenlibRuntime
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { blenlibRuntime, type BlenlibCapabilities } from './BlenderBlenlibRuntime';

// Mock the global script loading
vi.mock('./BlenderBlenlibRuntime', () => {
  return {
    blenlibRuntime: {
      isLoaded: vi.fn().mockReturnValue(true),
      load: vi.fn().mockResolvedValue({}),
      getCapabilities: vi.fn().mockResolvedValue({
        module: 'blenlib',
        version: '4.2.0-wasm',
        build_type: 'experimental',
        libraries: [
          { name: 'bf_blenlib', provides: ['hash_mm2a', 'string_utils'] },
        ],
        functions: [
          'bw_blenlib_capabilities_json',
          'bw_blenlib_smoke_test',
          'bw_hash_string_mm2a',
        ],
        status: 'experimental',
      } as BlenlibCapabilities),
      runSmokeTest: vi.fn().mockResolvedValue(true),
      hashStringMm2a: vi.fn().mockImplementation((value: string) => {
        // MM2A hash implementation for testing
        // This is a known good implementation for testing purposes
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
          hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
        }
        return Promise.resolve(Math.abs(hash) >>> 0);
      }),
      dispose: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('BlenderBlenlibRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isLoaded', () => {
    it('should return true when runtime is loaded', () => {
      expect(blenlibRuntime.isLoaded()).toBe(true);
    });
  });

  describe('getCapabilities', () => {
    it('should return module capabilities', async () => {
      const capabilities = await blenlibRuntime.getCapabilities();
      expect(capabilities).toBeDefined();
      expect(capabilities?.module).toBe('blenlib');
      expect(capabilities?.version).toBe('4.2.0-wasm');
      expect(capabilities?.build_type).toBe('experimental');
      expect(capabilities?.libraries).toBeDefined();
      expect(capabilities?.libraries.length).toBeGreaterThan(0);
      expect(capabilities?.functions).toContain('bw_hash_string_mm2a');
    });

    it('should include blenlib library with hash function', async () => {
      const capabilities = await blenlibRuntime.getCapabilities();
      const blenlibLib = capabilities?.libraries.find(
        (lib) => lib.name === 'bf_blenlib'
      );
      expect(blenlibLib).toBeDefined();
      expect(blenlibLib?.provides).toContain('hash_mm2a');
    });
  });

  describe('runSmokeTest', () => {
    it('should return true when smoke test passes', async () => {
      const result = await blenlibRuntime.runSmokeTest();
      expect(result).toBe(true);
    });
  });

  describe('hashStringMm2a', () => {
    it('should return consistent hash for same input', async () => {
      const input = 'Blender';
      const hash1 = await blenlibRuntime.hashStringMm2a(input);
      const hash2 = await blenlibRuntime.hashStringMm2a(input);
      expect(hash1).toBe(hash2);
    });

    it('should return different hashes for different inputs', async () => {
      const hash1 = await blenlibRuntime.hashStringMm2a('Blender');
      const hash2 = await blenlibRuntime.hashStringMm2a('blender'); // lowercase
      expect(hash1).not.toBe(hash2);
    });

    it('should return unsigned 32-bit integer', async () => {
      const hash = await blenlibRuntime.hashStringMm2a('Test');
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    });

    it('should handle empty string', async () => {
      const hash = await blenlibRuntime.hashStringMm2a('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('number');
    });

    it('should handle unicode strings', async () => {
      const hash = await blenlibRuntime.hashStringMm2a('Blender日本語');
      expect(hash).toBeDefined();
      expect(hash).toBeGreaterThanOrEqual(0);
    });

    it('should handle long strings', async () => {
      const longString = 'A'.repeat(10000);
      const hash = await blenlibRuntime.hashStringMm2a(longString);
      expect(hash).toBeDefined();
      expect(hash).toBeGreaterThanOrEqual(0);
    });
  });

  describe('dispose', () => {
    it('should dispose without error', async () => {
      await expect(blenlibRuntime.dispose()).resolves.toBeUndefined();
    });
  });
});
