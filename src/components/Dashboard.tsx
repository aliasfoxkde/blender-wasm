import { Component, For, Show } from 'solid-js';
import type { CapabilityProfile } from '../core/HardwareProfiler';

interface Project {
  name: string;
  path: string;
  lastOpened: Date;
}

interface DashboardProps {
  recentProjects: Project[];
  capabilityProfile: CapabilityProfile | null;
  onOpenProject: () => void;
  onNewProject: () => void;
}

export const Dashboard: Component<DashboardProps> = (props) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getGPUCapability = () => {
    const gpu = props.capabilityProfile?.gpu;
    if (!gpu) return 'Unknown';
    if (gpu.webgpu) return `${gpu.renderer} (WebGPU)`;
    if (gpu.webgl) return `${gpu.renderer} (WebGL)`;
    return 'Limited';
  };

  return (
    <div class="dashboard">
      <div class="dashboard-content">
        <section class="quick-actions">
          <button class="action-card primary" onClick={props.onNewProject}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>New Project</span>
          </button>

          <button class="action-card" onClick={props.onOpenProject}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <span>Open File</span>
          </button>

          <button class="action-card" disabled>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 10v6M9 13h6"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <span>Templates</span>
            <span class="badge">Soon</span>
          </button>
        </section>

        <section class="recent-projects">
          <h2>Recent Projects</h2>
          <Show
            when={props.recentProjects.length > 0}
            fallback={
              <div class="empty-state">
                <p>No recent projects</p>
                <p>Create a new project to get started</p>
              </div>
            }
          >
            <div class="project-list">
              <For each={props.recentProjects}>
                {(project) => (
                  <button class="project-item" onClick={props.onOpenProject}>
                    <div class="project-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                      </svg>
                    </div>
                    <div class="project-info">
                      <span class="project-name">{project.name}</span>
                      <span class="project-date">{formatDate(project.lastOpened)}</span>
                    </div>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </section>

        <Show when={props.capabilityProfile}>
          {(profile) => (
            <section class="system-info">
              <h2>System Capabilities</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">CPU</span>
                  <span class="info-value">{profile().cpu.cores} cores</span>
                </div>
                <div class="info-item">
                  <span class="info-label">GPU</span>
                  <span class="info-value">{getGPUCapability()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">RAM</span>
                  <span class="info-value">{profile().memory.ramGB} GB</span>
                </div>
                <div class="info-item">
                  <span class="info-label">SIMD</span>
                  <span class="info-value">{profile().features.simd ? 'Yes' : 'No'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Threads</span>
                  <span class="info-value">{profile().features.threads ? 'Yes' : 'No'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Storage</span>
                  <span class="info-value">{profile().storage.quotaMB} MB available</span>
                </div>
              </div>
            </section>
          )}
        </Show>
      </div>

      <style>{`
        .dashboard {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        .dashboard-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2xl);
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
        }

        .action-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-xl);
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-lg);
          color: var(--color-text-primary);
          transition: all var(--transition-normal);
          position: relative;
        }

        .action-card:hover:not(:disabled) {
          background: var(--color-bg-lighter);
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .action-card.primary {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .action-card.primary:hover {
          background: var(--color-primary-dark);
          border-color: var(--color-primary-dark);
        }

        .action-card span {
          font-weight: 500;
        }

        .action-card .badge {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-bg-darker);
          border-radius: var(--radius-full);
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }

        .recent-projects h2,
        .system-info h2 {
          font-size: var(--font-lg);
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          background: var(--color-bg-light);
          border-radius: var(--radius-lg);
          color: var(--color-text-muted);
        }

        .project-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .project-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          transition: all var(--transition-fast);
          text-align: left;
          width: 100%;
        }

        .project-item:hover {
          background: var(--color-bg-lighter);
          border-color: var(--color-primary);
        }

        .project-icon {
          color: var(--color-primary);
        }

        .project-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .project-name {
          font-weight: 500;
        }

        .project-date {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          padding: var(--spacing-md);
          background: var(--color-bg-light);
          border-radius: var(--radius-md);
        }

        .info-label {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .info-value {
          font-weight: 500;
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
};
