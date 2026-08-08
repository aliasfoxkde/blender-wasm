import { Component, For, Show, createSignal } from 'solid-js';
import type { CapabilityProfile } from '../core/HardwareProfiler';
import { TemplateGallery, NewsSection, AIAssistant } from '../shell';
import type { Project } from '../shell';

interface DashboardProps {
  recentProjects: Project[];
  capabilityProfile: CapabilityProfile | null;
  onOpenProject: () => void;
  onNewProject: () => void;
}

export const Dashboard: Component<DashboardProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'home' | 'templates' | 'news' | 'ai'>('home');

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'templates', label: 'Templates', icon: '📐' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'ai', label: 'AI', icon: '🤖' }
  ] as const;

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
      <div class="dashboard-layout">
        <aside class="dashboard-sidebar">
          <nav class="sidebar-nav">
            <For each={tabs}>
              {(tab) => (
                <button
                  class={`nav-item ${activeTab() === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span class="nav-icon">{tab.icon}</span>
                  <span class="nav-label">{tab.label}</span>
                </button>
              )}
            </For>
          </nav>

          <Show when={props.capabilityProfile}>
            <div class="system-status">
              <h4>System</h4>
              <div class="status-item">
                <span class="status-label">GPU</span>
                <span
                  class="status-value"
                  style={{
                    color: props.capabilityProfile?.gpu.webgpu
                      ? 'var(--color-success)'
                      : props.capabilityProfile?.gpu.webgl
                      ? 'var(--color-warning)'
                      : 'var(--color-error)'
                  }}
                >
                  {props.capabilityProfile?.gpu.webgpu ? '✓' : props.capabilityProfile?.gpu.webgl ? '◐' : '✗'}
                </span>
              </div>
              <div class="status-item">
                <span class="status-label">Cores</span>
                <span class="status-value">{props.capabilityProfile?.cpu.cores}</span>
              </div>
              <div class="status-item">
                <span class="status-label">RAM</span>
                <span class="status-value">{props.capabilityProfile?.memory.ramGB} GB</span>
              </div>
            </div>
          </Show>
        </aside>

        <main class="dashboard-content">
          {/* Home Tab */}
          <Show when={activeTab() === 'home'}>
            <section class="quick-actions">
              <button class="action-card primary" onClick={props.onNewProject}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>New Project</span>
              </button>

              <button class="action-card" onClick={props.onOpenProject}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                <span>Open File</span>
              </button>

              <button class="action-card" onClick={() => setActiveTab('templates')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
                <span>Browse Templates</span>
              </button>
            </section>

            <section class="recent-section">
              <h2>Recent Projects</h2>
              <Show
                when={props.recentProjects.length > 0}
                fallback={
                  <div class="empty-state">
                    <p>No recent projects</p>
                    <button class="link-btn" onClick={props.onNewProject}>Create your first project</button>
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

            <section class="system-section">
              <h2>System Capabilities</h2>
              <Show when={props.capabilityProfile}>
                {(profile) => (
                  <div class="capability-grid">
                    <div class="capability-card">
                      <span class="capability-label">Graphics</span>
                      <span class="capability-value">{getGPUCapability()}</span>
                    </div>
                    <div class="capability-card">
                      <span class="capability-label">CPU</span>
                      <span class="capability-value">{profile().cpu.cores} cores</span>
                    </div>
                    <div class="capability-card">
                      <span class="capability-label">RAM</span>
                      <span class="capability-value">{profile().memory.ramGB} GB</span>
                    </div>
                    <div class="capability-card">
                      <span class="capability-label">SIMD</span>
                      <span class="capability-value">{profile().features.simd ? '✓' : '✗'}</span>
                    </div>
                  </div>
                )}
              </Show>
            </section>
          </Show>

          {/* Templates Tab */}
          <Show when={activeTab() === 'templates'}>
            <TemplateGallery onSelect={(_template) => {
              props.onNewProject();
            }} />
          </Show>

          {/* News Tab */}
          <Show when={activeTab() === 'news'}>
            <NewsSection />
          </Show>

          {/* AI Tab */}
          <Show when={activeTab() === 'ai'}>
            <AIAssistant />
          </Show>
        </main>
      </div>

      <style>{`
        .dashboard {
          flex: 1;
          overflow: hidden;
        }

        .dashboard-layout {
          display: flex;
          height: 100%;
        }

        .dashboard-sidebar {
          width: 220px;
          background: var(--color-bg-darker);
          border-right: 1px solid var(--color-bg-lighter);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
          flex-shrink: 0;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          text-align: left;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          background: var(--color-bg-light);
          color: var(--color-text-primary);
        }

        .nav-item.active {
          background: var(--color-primary);
          color: white;
        }

        .nav-icon {
          font-size: var(--font-lg);
        }

        .system-status {
          margin-top: auto;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-bg-lighter);
        }

        .system-status h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-sm);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-xs) 0;
          font-size: var(--font-sm);
        }

        .status-label {
          color: var(--color-text-secondary);
        }

        .status-value {
          font-weight: 500;
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
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
        }

        .action-card:hover {
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
        }

        .action-card span {
          font-weight: 500;
        }

        .recent-section,
        .system-section {
          margin-bottom: var(--spacing-2xl);
        }

        .recent-section h2,
        .system-section h2 {
          font-size: var(--font-lg);
          margin-bottom: var(--spacing-md);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          background: var(--color-bg-light);
          border-radius: var(--radius-lg);
          color: var(--color-text-muted);
        }

        .empty-state p {
          margin: 0 0 var(--spacing-sm) 0;
        }

        .link-btn {
          background: none;
          color: var(--color-primary);
          text-decoration: underline;
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
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
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
          gap: 2px;
        }

        .project-name {
          font-weight: 500;
        }

        .project-date {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .capability-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-md);
        }

        .capability-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          padding: var(--spacing-md);
          background: var(--color-bg-light);
          border-radius: var(--radius-md);
        }

        .capability-label {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .capability-value {
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .dashboard-layout {
            flex-direction: column;
          }

          .dashboard-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
          }

          .sidebar-nav {
            flex-direction: row;
          }

          .system-status {
            display: none;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
