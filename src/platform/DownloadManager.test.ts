import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DownloadManager, DownloadTask } from './DownloadManager';

describe('DownloadManager', () => {
  let manager: DownloadManager;

  beforeEach(() => {
    manager = new DownloadManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending downloads
    const tasks = manager.getAllTasks();
    tasks.forEach(task => manager.cancel(task.id));
  });

  describe('download', () => {
    it('should create a download task', async () => {
      const downloadPromise = manager.download({
        url: '/test.wasm',
        filename: 'test.wasm',
      });

      // Task should be created immediately
      const tasks = manager.getAllTasks();
      expect(tasks.length).toBe(1);
      expect(tasks[0].filename).toBe('test.wasm');
      expect(tasks[0].status).toBeOneOf(['pending', 'downloading']);

      await downloadPromise;
    });

    it('should return task id', async () => {
      const id = await manager.download({
        url: '/test.wasm',
        filename: 'test.wasm',
      });

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('getTask', () => {
    it('should return undefined for non-existent task', () => {
      const task = manager.getTask('non-existent');
      expect(task).toBeUndefined();
    });

    it('should return task after download starts', async () => {
      const id = await manager.download({
        url: '/test.wasm',
        filename: 'test.wasm',
      });

      const task = manager.getTask(id);
      expect(task).toBeDefined();
      expect(task?.id).toBe(id);
    });
  });

  describe('getAllTasks', () => {
    it('should return empty array initially', () => {
      const tasks = manager.getAllTasks();
      expect(tasks).toEqual([]);
    });

    it('should return all tasks', async () => {
      await manager.download({
        url: '/test1.wasm',
        filename: 'test1.wasm',
      });

      await manager.download({
        url: '/test2.wasm',
        filename: 'test2.wasm',
      });

      const tasks = manager.getAllTasks();
      expect(tasks.length).toBe(2);
    });
  });

  describe('getActiveTasks', () => {
    it('should return empty array initially', () => {
      const tasks = manager.getActiveTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('pause', () => {
    it('should not throw for non-existent task', () => {
      expect(() => manager.pause('non-existent')).not.toThrow();
    });
  });

  describe('cancel', () => {
    it('should remove task after cancel', async () => {
      const id = await manager.download({
        url: '/test.wasm',
        filename: 'test.wasm',
      });

      expect(manager.getTask(id)).toBeDefined();
      manager.cancel(id);
      expect(manager.getTask(id)).toBeUndefined();
    });
  });
});
