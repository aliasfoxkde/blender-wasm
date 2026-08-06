import { describe, it, expect, vi } from 'vitest';
import { projectStorage } from './ProjectStorage';

describe('ProjectStorage', () => {
  it('should be a singleton instance', () => {
    expect(projectStorage).toBeDefined();
  });
});
