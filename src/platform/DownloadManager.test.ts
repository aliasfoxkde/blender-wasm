import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadManager } from './DownloadManager';

describe('DownloadManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending downloads
    const tasks = downloadManager.getAllTasks();
    tasks.forEach(task => downloadManager.cancel(task.id));
  });

  describe('download', () => {
    it('should create a download task', async () => {
      const downloadPromise = downloadManager.download({
        url: '/test-' + Date.now() + '.wasm',
        filename: 'test.wasm',
      });

      // Task should be created immediately
      const tasks = downloadManager.getAllTasks();
      expect(tasks.length).toBeGreaterThan(0);
      const task = tasks[tasks.length - 1];
      expect(task.filename).toBe('test.wasm');
      expect(task.status).toMatch(/^(pending|downloading)$/);

      await downloadPromise;
    });

    it('should return task id', async () => {
      const id = await downloadManager.download({
        url: '/test-' + Date.now() + '.wasm',
        filename: 'test.wasm',
      });

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('getTask', () => {
    it('should return undefined for non-existent task', () => {
      const task = downloadManager.getTask('non-existent');
      expect(task).toBeUndefined();
    });

    it('should return task after download starts', async () => {
      const id = await downloadManager.download({
        url: '/test-' + Date.now() + '.wasm',
        filename: 'test.wasm',
      });

      const task = downloadManager.getTask(id);
      expect(task).toBeDefined();
      expect(task?.id).toBe(id);
    });
  });

  describe('getAllTasks', () => {
    it('should return empty array initially', () => {
      // Clean up first
      downloadManager.getAllTasks().forEach(t => downloadManager.cancel(t.id));
      const tasks = downloadManager.getAllTasks();
      expect(tasks).toEqual([]);
    });

    it('should return all tasks', async () => {
      await downloadManager.download({
        url: '/test1-' + Date.now() + '.wasm',
        filename: 'test1.wasm',
      });

      await downloadManager.download({
        url: '/test2-' + Date.now() + '.wasm',
        filename: 'test2.wasm',
      });

      const tasks = downloadManager.getAllTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getActiveTasks', () => {
    it('should return empty array initially', () => {
      // Clean up first
      downloadManager.getAllTasks().forEach(t => downloadManager.cancel(t.id));
      const tasks = downloadManager.getActiveTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('pause', () => {
    it('should not throw for non-existent task', () => {
      expect(() => downloadManager.pause('non-existent')).not.toThrow();
    });
  });

  describe('cancel', () => {
    it('should remove task after cancel', async () => {
      const id = await downloadManager.download({
        url: '/test-' + Date.now() + '.wasm',
        filename: 'test.wasm',
      });

      expect(downloadManager.getTask(id)).toBeDefined();
      downloadManager.cancel(id);
      expect(downloadManager.getTask(id)).toBeUndefined();
    });
  });
});
