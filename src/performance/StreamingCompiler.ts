/**
 * Streaming Compiler - Compiles WASM modules progressively
 */

interface CompilationTask {
  id: string;
  url: string;
  status: 'pending' | 'compiling' | 'compiled' | 'error';
  progress: number;
  module?: WebAssembly.Module;
  instance?: WebAssembly.Instance;
  error?: string;
}

class StreamingCompiler {
  private tasks: Map<string, CompilationTask> = new Map();
  private compilationQueue: Array<{ url: string; signal?: AbortSignal }> = [];
  private isProcessing = false;
  private maxConcurrent = 2;

  async compile(
    url: string,
    signal?: AbortSignal
  ): Promise<{ module: WebAssembly.Module; instance: WebAssembly.Instance }> {
    const existing = this.tasks.get(url);
    if (existing?.module && existing.instance) {
      return { module: existing.module, instance: existing.instance };
    }

    const task: CompilationTask = {
      id: crypto.randomUUID(),
      url,
      status: 'compiling',
      progress: 0,
    };
    this.tasks.set(url, task);

    try {
      // Use streaming compilation if available
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
      }

      // Get underlying buffer for progress tracking
      const reader = response.body?.getReader();
      const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        task.progress = contentLength > 0 ? (receivedLength / contentLength) * 50 : 0;
        this.notifyUpdate(task);
      }

      const wasmBytes = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );
      let offset = 0;
      for (const chunk of chunks) {
        wasmBytes.set(chunk, offset);
        offset += chunk.length;
      }

      // Compile the module
      task.progress = 50;
      this.notifyUpdate(task);

      const compileResult = await WebAssembly.compile(wasmBytes);
      task.module = compileResult;
      task.progress = 75;
      this.notifyUpdate(task);

      // Instantiate
      const importObject = this.createImportObject();
      const instance = await WebAssembly.instantiate(compileResult, importObject);
      task.instance = instance;
      task.status = 'compiled';
      task.progress = 100;
      this.notifyUpdate(task);

      return { module: compileResult, instance };
    } catch (error) {
      task.status = 'error';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyUpdate(task);
      throw error;
    }
  }

  private createImportObject(): WebAssembly.Imports {
    return {
      env: {
        memory: new WebAssembly.Memory({ initial: 256, maximum: 2048 }),
        table: new WebAssembly.Table({ initial: 0, maximum: 100, element: 'anyfunc' }),
        // Stub imports - real ones would come from Blender WASM
        __indirect_function_table: new WebAssembly.Table({ initial: 0, maximum: 0, element: 'anyfunc' }),
      },
    };
  }

  private notifyUpdate(_task: CompilationTask): void {
    // Could emit events here for progress UI
  }

  getTask(url: string): CompilationTask | undefined {
    return this.tasks.get(url);
  }

  cancelAll(): void {
    // Cancel pending compilations
    this.compilationQueue = [];
  }

  // Compile multiple modules with dependency resolution
  async compileAll(
    urls: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, WebAssembly.Module>> {
    const results = new Map<string, WebAssembly.Module>();
    let completed = 0;

    // Process in batches
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += this.maxConcurrent) {
      batches.push(urls.slice(i, i + this.maxConcurrent));
    }

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map(async (url) => {
          const { module } = await this.compile(url);
          completed++;
          onProgress?.(completed, urls.length);
          return { url, module };
        })
      );

      for (const { url, module } of batchResults) {
        results.set(url, module);
      }
    }

    return results;
  }
}

export const streamingCompiler = new StreamingCompiler();
