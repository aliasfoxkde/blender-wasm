/**
 * Settings Storage - App-wide settings management
 */

export interface AppSettings {
  // Graphics
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  preferredRenderer: 'webgpu' | 'webgl' | 'auto';
  vsync: boolean;

  // Performance
  enableSIMD: boolean;
  enableThreads: boolean;
  maxMemoryMB: number;

  // UI
  theme: 'dark' | 'light' | 'auto';
  language: string;
  sidebarCollapsed: boolean;

  // Storage
  autoSave: boolean;
  autoSaveInterval: number; // minutes
  maxRecentProjects: number;

  // Network
  offlineMode: boolean;
  syncEnabled: boolean;

  // Advanced
  debugMode: boolean;
  developerMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  graphicsQuality: 'high',
  preferredRenderer: 'auto',
  vsync: true,
  enableSIMD: true,
  enableThreads: true,
  maxMemoryMB: 2048,
  theme: 'dark',
  language: 'en',
  sidebarCollapsed: false,
  autoSave: true,
  autoSaveInterval: 5,
  maxRecentProjects: 10,
  offlineMode: false,
  syncEnabled: false,
  debugMode: false,
  developerMode: false,
};

class SettingsStorage {
  private settings: AppSettings | null = null;
  private listeners: Set<() => void> = new Set();

  async init(): Promise<AppSettings> {
    if (this.settings) return this.settings;

    try {
      const stored = localStorage.getItem('blender-wasm-settings');
      if (stored) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }

    return this.settings!;
  }

  async get(): Promise<AppSettings> {
    if (!this.settings) {
      await this.init();
    }
    return this.settings!;
  }

  async set(updates: Partial<AppSettings>): Promise<void> {
    if (!this.settings) {
      await this.init();
    }

    this.settings = { ...this.settings!, ...updates };
    localStorage.setItem('blender-wasm-settings', JSON.stringify(this.settings));
    this.notifyListeners();
  }

  async reset(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS };
    localStorage.setItem('blender-wasm-settings', JSON.stringify(this.settings));
    this.notifyListeners();
  }

  onChange(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb());
  }

  async exportSettings(): Promise<string> {
    const settings = await this.get();
    return JSON.stringify(settings, null, 2);
  }

  async importSettings(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    await this.set(data);
  }
}

export const settingsStorage = new SettingsStorage();
