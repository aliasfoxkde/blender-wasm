import { Component, For, createSignal } from 'solid-js';

export interface NewsItem {
  id: string;
  type: 'update' | 'tutorial' | 'announcement';
  title: string;
  summary: string;
  date: Date;
  url: string;
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    type: 'update',
    title: 'Blender WASM v0.2.0 Released',
    summary: 'New WebGPU rendering pipeline with improved performance',
    date: new Date('2026-08-01'),
    url: '#'
  },
  {
    id: '2',
    type: 'tutorial',
    title: 'Getting Started with Web Shell',
    summary: 'Learn how to navigate the new dashboard interface',
    date: new Date('2026-07-28'),
    url: '#'
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Community Challenge: Create a Chair',
    summary: 'Submit your best chair model by August 15 for a chance to be featured',
    date: new Date('2026-07-25'),
    url: '#'
  }
];

export const NewsSection: Component = () => {
  const [activeFilter, setActiveFilter] = createSignal<string | null>(null);

  const filters = [
    { id: 'update', label: 'Updates' },
    { id: 'tutorial', label: 'Tutorials' },
    { id: 'announcement', label: 'Announcements' }
  ];

  const filteredNews = () => {
    const filter = activeFilter();
    if (!filter) return NEWS_ITEMS;
    return NEWS_ITEMS.filter(item => item.type === filter);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getTypeIcon = (type: NewsItem['type']) => {
    switch (type) {
      case 'update': return '🔄';
      case 'tutorial': return '📚';
      case 'announcement': return '📢';
    }
  };

  return (
    <div class="news-section">
      <div class="news-filters">
        <button
          class={`filter-btn ${activeFilter() === null ? 'active' : ''}`}
          onClick={() => setActiveFilter(null)}
        >
          All
        </button>
        <For each={filters}>
          {(filter) => (
            <button
              class={`filter-btn ${activeFilter() === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          )}
        </For>
      </div>

      <div class="news-list">
        <For each={filteredNews()}>
          {(item) => (
            <a href={item.url} class="news-item">
              <span class="news-icon">{getTypeIcon(item.type)}</span>
              <div class="news-content">
                <span class="news-title">{item.title}</span>
                <span class="news-summary">{item.summary}</span>
              </div>
              <span class="news-date">{formatDate(item.date)}</span>
            </a>
          )}
        </For>
      </div>

      <style>{`
        .news-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .news-filters {
          display: flex;
          gap: var(--spacing-sm);
        }

        .filter-btn {
          padding: var(--spacing-xs) var(--spacing-md);
          background: transparent;
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-full);
          color: var(--color-text-muted);
          font-size: var(--font-sm);
          transition: all var(--transition-fast);
        }

        .filter-btn:hover {
          color: var(--color-text-secondary);
          border-color: var(--color-text-muted);
        }

        .filter-btn.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .news-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .news-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-light);
          border-radius: var(--radius-md);
          text-decoration: none;
          color: inherit;
          transition: background var(--transition-fast);
        }

        .news-item:hover {
          background: var(--color-bg-lighter);
        }

        .news-icon {
          font-size: var(--font-lg);
          flex-shrink: 0;
        }

        .news-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .news-title {
          font-weight: 500;
          font-size: var(--font-sm);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .news-summary {
          font-size: var(--font-xs);
          color: var(--color-text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .news-date {
          font-size: var(--font-xs);
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};

export { NEWS_ITEMS };
