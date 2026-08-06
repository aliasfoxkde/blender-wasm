import { Component, For, Show, createSignal } from 'solid-js';
import { downloadManager, type DownloadTask } from '../platform/DownloadManager';

export const DownloadManagerUI: Component = () => {
  const [tasks, setTasks] = createSignal<DownloadTask[]>([]);
  const [isExpanded, setIsExpanded] = createSignal(false);

  // Poll for updates
  setInterval(() => {
    setTasks(downloadManager.getAllTasks());
  }, 500);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getStatusColor = (status: DownloadTask['status']): string => {
    switch (status) {
      case 'completed': return 'var(--color-success)';
      case 'downloading': return 'var(--color-primary)';
      case 'paused': return 'var(--color-warning)';
      case 'failed': return 'var(--color-error)';
      default: return 'var(--color-text-muted)';
    }
  };

  const activeTasks = () => tasks().filter(t => t.status === 'downloading');

  return (
    <Show when={tasks().length > 0}>
      <div class="download-manager">
        <button
          class="download-toggle"
          onClick={() => setIsExpanded(!isExpanded())}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          <Show when={activeTasks().length > 0}>
            <span class="download-badge">{activeTasks().length}</span>
          </Show>
        </button>

        <Show when={isExpanded()}>
          <div class="download-panel">
            <h3>Downloads</h3>
            <div class="download-list">
              <For each={tasks()}>
                {(task) => (
                  <div class="download-item">
                    <div class="download-info">
                      <span class="download-name">{task.filename}</span>
                      <span
                        class="download-status"
                        style={{ color: getStatusColor(task.status) }}
                      >
                        {task.status}
                      </span>
                    </div>

                    <Show when={task.status === 'downloading'}>
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          style={{
                            width: `${task.totalBytes > 0
                              ? (task.downloadedBytes / task.totalBytes) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                      <span class="download-size">
                        {formatBytes(task.downloadedBytes)}
                        <Show when={task.totalBytes > 0}>
                          {' / '}{formatBytes(task.totalBytes)}
                        </Show>
                      </span>
                    </Show>

                    <Show when={task.status === 'completed'}>
                      <span class="download-size">
                        {task.blob ? formatBytes(task.blob.size) : ''}
                      </span>
                    </Show>

                    <div class="download-actions">
                      <Show when={task.status === 'downloading'}>
                        <button onClick={() => downloadManager.pause(task.id)}>Pause</button>
                      </Show>
                      <Show when={task.status === 'paused'}>
                        <button onClick={() => downloadManager.resume(task.id)}>Resume</button>
                      </Show>
                      <button onClick={() => downloadManager.cancel(task.id)}>Cancel</button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>

        <style>{`
          .download-manager {
            position: fixed;
            bottom: var(--spacing-lg);
            right: var(--spacing-lg);
            z-index: 1000;
          }

          .download-toggle {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--color-primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: var(--shadow-lg);
            transition: transform var(--transition-fast);
          }

          .download-toggle:hover {
            transform: scale(1.1);
          }

          .download-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: var(--color-error);
            color: white;
            font-size: var(--font-xs);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .download-panel {
            position: absolute;
            bottom: 60px;
            right: 0;
            width: 320px;
            background: var(--color-bg-light);
            border: 1px solid var(--color-bg-lighter);
            border-radius: var(--radius-lg);
            padding: var(--spacing-md);
            box-shadow: var(--shadow-lg);
          }

          .download-panel h3 {
            margin: 0 0 var(--spacing-md) 0;
            font-size: var(--font-md);
          }

          .download-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
          }

          .download-item {
            padding: var(--spacing-sm);
            background: var(--color-bg-darker);
            border-radius: var(--radius-md);
          }

          .download-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: var(--spacing-xs);
          }

          .download-name {
            font-size: var(--font-sm);
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 180px;
          }

          .download-status {
            font-size: var(--font-xs);
            text-transform: uppercase;
          }

          .progress-bar {
            height: 4px;
            background: var(--color-bg-lighter);
            border-radius: var(--radius-full);
            overflow: hidden;
            margin-bottom: var(--spacing-xs);
          }

          .progress-fill {
            height: 100%;
            background: var(--color-primary);
            transition: width var(--transition-fast);
          }

          .download-size {
            font-size: var(--font-xs);
            color: var(--color-text-muted);
          }

          .download-actions {
            display: flex;
            gap: var(--spacing-xs);
            margin-top: var(--spacing-sm);
          }

          .download-actions button {
            flex: 1;
            padding: var(--spacing-xs);
            background: var(--color-bg-lighter);
            border-radius: var(--radius-sm);
            font-size: var(--font-xs);
            color: var(--color-text-secondary);
          }

          .download-actions button:hover {
            background: var(--color-primary);
            color: white;
          }
        `}</style>
      </div>
    </Show>
  );
};
