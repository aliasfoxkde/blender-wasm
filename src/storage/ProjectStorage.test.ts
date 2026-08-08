import { describe, it, expect } from 'vitest';
import { projectStorage } from './ProjectStorage';

describe('ProjectStorage', () => {
  it('should be a singleton instance', () => {
    expect(projectStorage).toBeDefined();
  });
});
