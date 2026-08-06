import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { settingsStorage, type AppSettings } from '../storage/SettingsStorage';

export const SettingsPanel: Component = () => {
  const [settings, setSettings] = createSignal<AppSettings | null>(null);
  const [activeSection, setActiveSection] = createSignal('graphics');

  onMount(async () => {
    const s = await settingsStorage.get();
    setSettings(s);
  });

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await settingsStorage.set({ [key]: value });
    setSettings(await settingsStorage.get());
  };

  const sections = [
    { id: 'graphics', label: 'Graphics', icon: '🎮' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'ui', label: 'User Interface', icon: '🖥️' },
    { id: 'storage', label: 'Storage', icon: '💾' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
  ];

  const renderGraphicsSettings = () => (
    <div class="settings-group">
      <label class="setting-item">
        <span class="setting-label">Graphics Quality</span>
        <select
          class="setting-select"
          value={settings()?.graphicsQuality}
          onChange={(e) => updateSetting('graphicsQuality', e.currentTarget.value as AppSettings['graphicsQuality'])}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="ultra">Ultra</option>
        </select>
      </label>

      <label class="setting-item">
        <span class="setting-label">Preferred Renderer</span>
        <select
          class="setting-select"
          value={settings()?.preferredRenderer}
          onChange={(e) => updateSetting('preferredRenderer', e.currentTarget.value as AppSettings['preferredRenderer'])}
        >
          <option value="auto">Auto-detect</option>
          <option value="webgpu">WebGPU</option>
          <option value="webgl">WebGL</option>
        </select>
      </label>

      <label class="setting-item toggle">
        <span class="setting-label">VSync</span>
        <input
          type="checkbox"
          checked={settings()?.vsync}
          onChange={(e) => updateSetting('vsync', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div class="settings-group">
      <label class="setting-item toggle">
        <span class="setting-label">Enable SIMD</span>
        <input
          type="checkbox"
          checked={settings()?.enableSIMD}
          onChange={(e) => updateSetting('enableSIMD', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>

      <label class="setting-item toggle">
        <span class="setting-label">Enable Threads</span>
        <input
          type="checkbox"
          checked={settings()?.enableThreads}
          onChange={(e) => updateSetting('enableThreads', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>

      <label class="setting-item">
        <span class="setting-label">Max Memory (MB)</span>
        <input
          type="number"
          class="setting-input"
          value={settings()?.maxMemoryMB}
          min={512}
          max={8192}
          step={256}
          onChange={(e) => updateSetting('maxMemoryMB', parseInt(e.currentTarget.value))}
        />
      </label>
    </div>
  );

  const renderUISettings = () => (
    <div class="settings-group">
      <label class="setting-item">
        <span class="setting-label">Theme</span>
        <select
          class="setting-select"
          value={settings()?.theme}
          onChange={(e) => updateSetting('theme', e.currentTarget.value as AppSettings['theme'])}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto">Auto</option>
        </select>
      </label>

      <label class="setting-item">
        <span class="setting-label">Language</span>
        <select
          class="setting-select"
          value={settings()?.language}
          onChange={(e) => updateSetting('language', e.currentTarget.value)}
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </label>

      <label class="setting-item toggle">
        <span class="setting-label">Collapse Sidebar</span>
        <input
          type="checkbox"
          checked={settings()?.sidebarCollapsed}
          onChange={(e) => updateSetting('sidebarCollapsed', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>
    </div>
  );

  const renderStorageSettings = () => (
    <div class="settings-group">
      <label class="setting-item toggle">
        <span class="setting-label">Auto Save</span>
        <input
          type="checkbox"
          checked={settings()?.autoSave}
          onChange={(e) => updateSetting('autoSave', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>

      <Show when={settings()?.autoSave}>
        <label class="setting-item">
          <span class="setting-label">Auto Save Interval (minutes)</span>
          <input
            type="number"
            class="setting-input"
            value={settings()?.autoSaveInterval}
            min={1}
            max={30}
            onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.currentTarget.value))}
          />
        </label>
      </Show>

      <label class="setting-item">
        <span class="setting-label">Recent Projects</span>
        <input
          type="number"
          class="setting-input"
          value={settings()?.maxRecentProjects}
          min={5}
          max={50}
          onChange={(e) => updateSetting('maxRecentProjects', parseInt(e.currentTarget.value))}
        />
      </label>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div class="settings-group">
      <label class="setting-item toggle">
        <span class="setting-label">Offline Mode</span>
        <input
          type="checkbox"
          checked={settings()?.offlineMode}
          onChange={(e) => updateSetting('offlineMode', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>

      <label class="setting-item toggle">
        <span class="setting-label">Debug Mode</span>
        <input
          type="checkbox"
          checked={settings()?.debugMode}
          onChange={(e) => updateSetting('debugMode', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>

      <label class="setting-item toggle">
        <span class="setting-label">Developer Mode</span>
        <input
          type="checkbox"
          checked={settings()?.developerMode}
          onChange={(e) => updateSetting('developerMode', e.currentTarget.checked)}
        />
        <span class="toggle-slider" />
      </label>

      <button class="reset-btn" onClick={() => settingsStorage.reset()}>
        Reset to Defaults
      </button>
    </div>
  );

  return (
    <div class="settings-panel">
      <div class="settings-header">
        <h2>Settings</h2>
      </div>

      <div class="settings-layout">
        <nav class="settings-nav">
          <For each={sections}>
            {(section) => (
              <button
                class={`nav-item ${activeSection() === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <span class="nav-icon">{section.icon}</span>
                <span class="nav-label">{section.label}</span>
              </button>
            )}
          </For>
        </nav>

        <div class="settings-content">
          <Show when={activeSection() === 'graphics'}>{renderGraphicsSettings()}</Show>
          <Show when={activeSection() === 'performance'}>{renderPerformanceSettings()}</Show>
          <Show when={activeSection() === 'ui'}>{renderUISettings()}</Show>
          <Show when={activeSection() === 'storage'}>{renderStorageSettings()}</Show>
          <Show when={activeSection() === 'advanced'}>{renderAdvancedSettings()}</Show>
        </div>
      </div>

      <style>{`
        .settings-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg-dark);
        }

        .settings-header {
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--color-bg-lighter);
        }

        .settings-header h2 {
          margin: 0;
          font-size: var(--font-lg);
        }

        .settings-layout {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .settings-nav {
          width: 200px;
          padding: var(--spacing-md);
          border-right: 1px solid var(--color-bg-lighter);
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

        .settings-content {
          flex: 1;
          padding: var(--spacing-lg);
          overflow-y: auto;
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: var(--color-bg-light);
          border-radius: var(--radius-md);
        }

        .setting-item.toggle {
          cursor: pointer;
        }

        .setting-label {
          font-weight: 500;
        }

        .setting-select,
        .setting-input {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-darker);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--font-sm);
        }

        .setting-select:focus,
        .setting-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .setting-input[type="number"] {
          width: 100px;
          text-align: center;
        }

        .toggle {
          position: relative;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }

        .toggle-slider {
          width: 48px;
          height: 24px;
          background: var(--color-bg-lighter);
          border-radius: var(--radius-full);
          position: relative;
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
          background: var(--color-primary);
        }

        .toggle input:checked + .toggle-slider::before {
          transform: translateX(24px);
        }

        .reset-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-error);
          color: white;
          border-radius: var(--radius-md);
          font-weight: 500;
          margin-top: var(--spacing-lg);
        }

        .reset-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};
