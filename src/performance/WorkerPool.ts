/**
 * Worker Pool - Manages Web Workers for parallel processing
 */

interface WorkerTask {
  id: string;
  type: string;
  data: unknown;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private pendingTasks: WorkerTask[] = [];
  private taskWorkerMap: Map<string, Worker> = new Map();
  private maxWorkers: number;

  constructor(maxWorkers = navigator.hardwareConcurrency || 4) {
    this.maxWorkers = Math.min(maxWorkers, 8); // Cap at 8 workers
  }

  async init(): Promise<void> {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
    console.log(`Worker pool initialized with ${this.maxWorkers} workers`);
  }

  private createWorker(): Worker {
    const worker = new Worker(
      new URL('./workers/generic.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const task = this.pendingTasks.find((t) => t.id === id);
      if (!task) return;

      const worker = this.taskWorkerMap.get(id);
      if (worker) {
        this.taskWorkerMap.delete(id);
        this.availableWorkers.push(worker);
      }

      if (error) {
        task.reject(new Error(error));
      } else {
        task.resolve(result);
      }

      this.pendingTasks = this.pendingTasks.filter((t) => t.id !== id);
      this.processNext();
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
    };

    return worker;
  }

  private processNext(): void {
    if (this.pendingTasks.length === 0) return;
    if (this.availableWorkers.length === 0) return;

    const task = this.pendingTasks[0];
    const worker = this.availableWorkers.shift()!;

    this.taskWorkerMap.set(task.id, worker);
    worker.postMessage({ id: task.id, type: task.type, data: task.data });
  }

  async execute(type: string, data: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = {
        id: crypto.randomUUID(),
        type,
        data,
        resolve,
        reject,
      };

      this.pendingTasks.push(task);
      this.processNext();
    });
  }

  async terminate(): Promise<void> {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.availableWorkers = [];
    this.pendingTasks = [];
    this.taskWorkerMap.clear();
  }

  getStats() {
    return {
      total: this.workers.length,
      available: this.availableWorkers.length,
      busy: this.workers.length - this.availableWorkers.length,
      pending: this.pendingTasks.length,
    };
  }
}

export const workerPool = new WorkerPool();
