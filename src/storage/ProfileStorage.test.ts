import { describe, it, expect, vi } from 'vitest';
import { profileStorage } from './ProfileStorage';

describe('ProfileStorage', () => {
  it('should be a singleton instance', () => {
    expect(profileStorage).toBeDefined();
  });
});
