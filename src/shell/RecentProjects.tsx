import { Component, For, Show, createSignal } from 'solid-js';

export interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  thumbnail?: string;
  size?: number;
}

interface RecentProjectsProps {
  projects: Project[];
  onOpen: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const RecentProjects: Component<RecentProjectsProps> = (props) => {
  const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; project: Project } | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(mb * 1024)} KB` : `${mb.toFixed(1)} MB`;
  };

  const handleContextMenu = (e: MouseEvent, project: Project) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, project });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div class="recent-projects" onClick={closeContextMenu}>
      <h2>Recent Projects</h2>

      <Show
        when={props.projects.length > 0}
        fallback={
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
            <p>No recent projects</p>
            <p class="hint">Create a new project to get started</p>
          </div>
        }
      >
        <div class="project-grid">
          <For each={props.projects}>
            {(project) => (
              <button
                class="project-card"
                onClick={() => props.onOpen(project)}
                onContextMenu={(e) => handleContextMenu(e, project)}
              >
                <div class="project-thumbnail">
                  <Show when={project.thumbnail} fallback={
                    <div class="placeholder-thumb">
                      <span>{project.name[0].toUpperCase()}</span>
                    </div>
                  }>
                    <img src={project.thumbnail} alt={project.name} />
                  </Show>
                </div>
                <div class="project-info">
                  <span class="project-name">{project.name}</span>
                  <span class="project-meta">
                    {formatDate(project.lastOpened)}
                    <Show when={project.size}>
                      {' • '}{formatSize(project.size)}
                    </Show>
                  </span>
                </div>
              </button>
            )}
          </For>
        </div>
      </Show>

      <Show when={contextMenu()}>
        {(menu) => (
          <div
            class="context-menu"
            style={{ left: `${menu().x}px`, top: `${menu().y}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { props.onOpen(menu().project); closeContextMenu(); }}>
              Open
            </button>
            <button onClick={() => { props.onDelete(menu().project); closeContextMenu(); }}>
              Delete
            </button>
          </div>
        )}
      </Show>

      <style>{`
        .recent-projects {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .recent-projects h2 {
          margin: 0;
          font-size: var(--font-lg);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-2xl);
          background: var(--color-bg-light);
          border-radius: var(--radius-lg);
          text-align: center;
          color: var(--color-text-muted);
        }

        .empty-state p {
          margin: 0;
        }

        .empty-state .hint {
          font-size: var(--font-sm);
        }

        .project-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: var(--spacing-md);
        }

        .project-card {
          display: flex;
          flex-direction: column;
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-lg);
          overflow: hidden;
          text-align: left;
          transition: all var(--transition-normal);
        }

        .project-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .project-thumbnail {
          height: 100px;
          background: var(--color-bg-darker);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .project-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-thumb {
          width: 48px;
          height: 48px;
          background: var(--color-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-xl);
          font-weight: bold;
          color: white;
        }

        .project-info {
          padding: var(--spacing-sm) var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .project-name {
          font-weight: 500;
          font-size: var(--font-sm);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .project-meta {
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }

        .context-menu {
          position: fixed;
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          padding: var(--spacing-xs);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        .context-menu button {
          display: block;
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          text-align: left;
          font-size: var(--font-sm);
          border-radius: var(--radius-sm);
        }

        .context-menu button:hover {
          background: var(--color-bg-lighter);
        }
      `}</style>
    </div>
  );
};
