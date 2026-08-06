/**
 * Download Manager with resumable downloads and progress tracking
 */

export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  totalBytes: number;
  downloadedBytes: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  error?: string;
  blob?: Blob;
  onProgress?: (progress: number, downloaded: number, total: number) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class DownloadManager {
  private tasks: Map<string, DownloadTask> = new Map();
  private activeDownloads: Map<string, AbortController> = new Map();

  async download(options: {
    url: string;
    filename: string;
    onProgress?: (progress: number, downloaded: number, total: number) => void;
    onComplete?: (blob: Blob) => void;
    onError?: (error: Error) => void;
  }): Promise<string> {
    const id = crypto.randomUUID();
    const task: DownloadTask = {
      id,
      url: options.url,
      filename: options.filename,
      totalBytes: 0,
      downloadedBytes: 0,
      status: 'pending',
      onProgress: options.onProgress,
      onComplete: options.onComplete,
      onError: options.onError,
    };

    this.tasks.set(id, task);
    this.startDownload(id);
    return id;
  }

  private async startDownload(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) return;

    const abortController = new AbortController();
    this.activeDownloads.set(id, abortController);

    task.status = 'downloading';

    try {
      const response = await fetch(task.url, {
        signal: abortController.signal,
        headers: {
          Range: task.downloadedBytes > 0
            ? `bytes=${task.downloadedBytes}-`
            : undefined,
        } as any,
      });

      if (!response.ok && response.status !== 206) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('Content-Length');
      task.totalBytes = contentLength
        ? parseInt(contentLength, 10) + task.downloadedBytes
        : 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const chunks: Uint8Array[] = [];
      let receivedBytes = task.downloadedBytes;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;
        task.downloadedBytes = receivedBytes;

        if (task.totalBytes > 0) {
          const progress = (receivedBytes / task.totalBytes) * 100;
          task.onProgress?.(progress, receivedBytes, task.totalBytes);
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks);
      task.blob = blob;
      task.status = 'completed';
      task.onComplete?.(blob);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        task.status = 'paused';
      } else {
        task.status = 'failed';
        task.error = error.message;
        task.onError?.(error);
      }
    } finally {
      this.activeDownloads.delete(id);
    }
  }

  pause(id: string): void {
    const abortController = this.activeDownloads.get(id);
    if (abortController) {
      abortController.abort();
      const task = this.tasks.get(id);
      if (task) {
        task.status = 'paused';
      }
    }
  }

  resume(id: string): void {
    const task = this.tasks.get(id);
    if (task && task.status === 'paused') {
      this.startDownload(id);
    }
  }

  cancel(id: string): void {
    this.pause(id);
    this.tasks.delete(id);
  }

  getTask(id: string): DownloadTask | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }

  getActiveTasks(): DownloadTask[] {
    return this.getAllTasks().filter(t => t.status === 'downloading');
  }
}

export const downloadManager = new DownloadManager();
