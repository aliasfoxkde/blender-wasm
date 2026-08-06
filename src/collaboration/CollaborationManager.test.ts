import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollaborationManager } from './CollaborationManager';

describe('CollaborationManager', () => {
  let manager: CollaborationManager;

  beforeEach(() => {
    manager = new CollaborationManager();
    vi.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('should return false without cloud auth', async () => {
      const enabled = await manager.isEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe('on', () => {
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = manager.on('test-event', callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('connect', () => {
    it('should not throw', async () => {
      await expect(manager.connect()).resolves.not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should not throw', () => {
      expect(() => manager.disconnect()).not.toThrow();
    });
  });

  describe('shareProject', () => {
    it('should throw when not enabled', async () => {
      await expect(manager.shareProject({
        projectId: 'test',
        permissions: 'view',
      })).rejects.toThrow('Collaboration requires cloud account');
    });
  });

  describe('getComments', () => {
    it('should return empty array', async () => {
      const comments = await manager.getComments('share-id');
      expect(comments).toEqual([]);
    });
  });

  describe('addComment', () => {
    it('should return a comment', async () => {
      const comment = await manager.addComment('share-id', 'Test comment');
      expect(comment).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(comment.author).toBeDefined();
    });
  });

  describe('resolveComment', () => {
    it('should not throw', async () => {
      await expect(manager.resolveComment('share-id', 'comment-id')).resolves.not.toThrow();
    });
  });
});
