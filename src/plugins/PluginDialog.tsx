import { Component, For, Show, createSignal } from 'solid-js';
import { pluginManager, type Plugin } from './PluginManager';

interface PluginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginDialog: Component<PluginDialogProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'installed' | 'available' | 'marketplace'>('installed');

  const getPlugins = () => pluginManager.getAllPlugins();
  const getLoadedPlugins = () => pluginManager.getLoadedPlugins();

  const handleToggle = async (plugin: Plugin) => {
    if (plugin.status === 'loaded') {
      await pluginManager.disablePlugin(plugin.manifest.id);
    } else if (plugin.status === 'registered') {
      await pluginManager.enablePlugin(plugin.manifest.id);
    }
  };

  const getStatusColor = (status: Plugin['status']) => {
    switch (status) {
      case 'loaded': return 'var(--color-success)';
      case 'loading': return 'var(--color-warning)';
      case 'error': return 'var(--color-error)';
      case 'disabled': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  const getPermissionIcon = (type: string) => {
    switch (type) {
      case 'filesystem': return '📁';
      case 'network': return '🌐';
      case 'scene': return '🎭';
      case 'ui': return '🖥️';
      case 'ai': return '🤖';
      default: return '🔒';
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class="plugin-overlay" onClick={() => props.onClose()}>
        <div class="plugin-dialog" onClick={(e) => e.stopPropagation()}>
          <div class="plugin-header">
            <h2>Plugins</h2>
            <button class="close-btn" onClick={() => props.onClose()}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="plugin-tabs">
            <button
              class={`tab ${activeTab() === 'installed' ? 'active' : ''}`}
              onClick={() => setActiveTab('installed')}
            >
              Installed
            </button>
            <button
              class={`tab ${activeTab() === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Available
            </button>
            <button
              class={`tab ${activeTab() === 'marketplace' ? 'active' : ''}`}
              onClick={() => setActiveTab('marketplace')}
            >
              Marketplace
            </button>
          </div>

          <div class="plugin-content">
            <Show when={activeTab() === 'installed'}>
              <div class="plugin-list">
                <For each={getPlugins()} fallback={
                  <div class="empty-state">
                    <p>No plugins installed</p>
                  </div>
                }>
                  {(plugin) => (
                    <div class="plugin-item">
                      <div class="plugin-info">
                        <div class="plugin-header-row">
                          <span class="plugin-name">{plugin.manifest.name}</span>
                          <span
                            class="plugin-status"
                            style={{ color: getStatusColor(plugin.status) }}
                          >
                            {plugin.status}
                          </span>
                        </div>
                        <p class="plugin-desc">{plugin.manifest.description}</p>
                        <div class="plugin-permissions">
                          <For each={plugin.manifest.permissions}>
                            {(perm) => (
                              <span class="permission-badge" title={`${perm.access} ${perm.type}`}>
                                {getPermissionIcon(perm.type)} {perm.type}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                      <div class="plugin-actions">
                        <label class="toggle">
                          <input
                            type="checkbox"
                            checked={plugin.status === 'loaded'}
                            onChange={() => handleToggle(plugin)}
                          />
                          <span class="toggle-slider" />
                        </label>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={activeTab() === 'available'}>
              <div class="plugin-list">
                <For each={getPlugins().filter(p => p.status !== 'loaded' && p.status !== 'registered')}>
                  {(plugin) => (
                    <div class="plugin-item">
                      <div class="plugin-info">
                        <span class="plugin-name">{plugin.manifest.name}</span>
                        <p class="plugin-desc">{plugin.manifest.description}</p>
                      </div>
                      <button
                        class="install-btn"
                        onClick={() => pluginManager.loadPlugin(plugin.manifest.id)}
                      >
                        Install
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={activeTab() === 'marketplace'}>
              <div class="empty-state">
                <p>🌐 Marketplace coming soon</p>
                <p class="hint">Discover community plugins</p>
              </div>
            </Show>
          </div>

          <div class="plugin-footer">
            <span>{getLoadedPlugins().length} plugins active</span>
          </div>
        </div>
      </div>

      <style>{`
        .plugin-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .plugin-dialog {
          background: var(--color-bg-light);
          border-radius: var(--radius-lg);
          width: 600px;
          max-width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .plugin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-bg-lighter);
        }

        .plugin-header h2 {
          margin: 0;
        }

        .close-btn {
          background: transparent;
          color: var(--color-text-muted);
          padding: var(--spacing-xs);
          border-radius: var(--radius-md);
        }

        .close-btn:hover {
          background: var(--color-bg-lighter);
          color: var(--color-text-primary);
        }

        .plugin-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-bg-lighter);
        }

        .tab {
          flex: 1;
          padding: var(--spacing-md);
          background: transparent;
          color: var(--color-text-secondary);
          border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
        }

        .tab:hover {
          color: var(--color-text-primary);
        }

        .tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }

        .plugin-content {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-md);
        }

        .plugin-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .plugin-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: var(--color-bg-darker);
          border-radius: var(--radius-md);
        }

        .plugin-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .plugin-name {
          font-weight: 600;
        }

        .plugin-status {
          font-size: var(--font-xs);
          text-transform: uppercase;
        }

        .plugin-desc {
          margin: var(--spacing-xs) 0;
          font-size: var(--font-sm);
          color: var(--color-text-secondary);
        }

        .plugin-permissions {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .permission-badge {
          padding: 2px var(--spacing-sm);
          background: var(--color-bg-lighter);
          border-radius: var(--radius-sm);
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }

        .install-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary);
          border-radius: var(--radius-md);
          color: white;
          font-weight: 500;
        }

        .install-btn:hover {
          background: var(--color-primary-dark);
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--color-bg-lighter);
          border-radius: var(--radius-full);
          transition: background var(--transition-fast);
        }

        .toggle-slider::before {
          content: "";
          position: absolute;
          width: 20px;
          height: 20px;
          left: 2px;
          top: 2px;
          background: white;
          border-radius: 50%;
          transition: transform var(--transition-fast);
        }

        .toggle input:checked + .toggle-slider {
          background: var(--color-success);
        }

        .toggle input:checked + .toggle-slider::before {
          transform: translateX(24px);
        }

        .plugin-footer {
          padding: var(--spacing-md) var(--spacing-lg);
          border-top: 1px solid var(--color-bg-lighter);
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-2xl);
          color: var(--color-text-muted);
        }

        .empty-state .hint {
          font-size: var(--font-sm);
          margin-top: var(--spacing-sm);
        }
      `}</style>
    </Show>
  );
};
