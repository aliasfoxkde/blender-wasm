import { describe, it, expect } from 'vitest';
import { profileStorage } from './ProfileStorage';

describe('ProfileStorage', () => {
  it('should be a singleton instance', () => {
    expect(profileStorage).toBeDefined();
  });
});
