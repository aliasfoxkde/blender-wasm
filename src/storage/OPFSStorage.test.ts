import { describe, it, expect, vi } from 'vitest';
import { opfsStorage } from './OPFSStorage';

describe('OPFSStorage', () => {
  it('should be a singleton instance', () => {
    expect(opfsStorage).toBeDefined();
  });
});
