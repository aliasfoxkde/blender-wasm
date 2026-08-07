import { Component, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Header } from './components/Header';
import { Splash } from './components/Splash';
import { Dashboard } from './components/Dashboard';
import { BlenderViewport } from './components/BlenderViewport';
import { DownloadManagerUI } from './components/DownloadProgress';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HardwareProfiler } from './core/HardwareProfiler';
import { pwaInstallManager } from './platform/PWAInstall';
import type { CapabilityProfile } from './core/HardwareProfiler';

export interface AppState {
  isLoading: boolean;
  loadProgress: number;
  capabilityProfile: CapabilityProfile | null;
  currentView: 'splash' | 'dashboard' | 'blender';
  recentProjects: Array<{ id: string; name: string; path: string; lastOpened: Date }>;
}

const App: Component = () => {
  const [state, setState] = createStore<AppState>({
    isLoading: true,
    loadProgress: 0,
    capabilityProfile: null,
    currentView: 'splash',
    recentProjects: []
  });

  onMount(async () => {
    // Initialize PWA install prompt
    pwaInstallManager.init();

    // Profile hardware capabilities
    const profiler = new HardwareProfiler();
    const profile = await profiler.profile();
    setState('capabilityProfile', profile);

    // Simulate loading progress for splash
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 50));
      setState('loadProgress', i);
    }

    // Load recent projects from IndexedDB
    // TODO: Implement actual IndexedDB storage
    setState('recentProjects', [
      { id: 'example-1', name: 'Example Project', path: '/projects/example.blend', lastOpened: new Date() }
    ]);

    setState('isLoading', false);
  });

  const handleStartBlender = () => {
    setState('currentView', 'blender');
  };

  const handleBackToDashboard = () => {
    setState('currentView', 'dashboard');
  };

  return (
    <div class="app">
      <Header
        currentView={state.currentView}
        onBack={handleBackToDashboard}
        capabilityProfile={state.capabilityProfile}
      />

      <OfflineIndicator />

      {state.currentView === 'splash' && (
        <Splash
          progress={state.loadProgress}
          onComplete={() => setState('currentView', 'dashboard')}
        />
      )}

      {state.currentView === 'dashboard' && (
        <Dashboard
          recentProjects={state.recentProjects}
          capabilityProfile={state.capabilityProfile}
          onOpenProject={handleStartBlender}
          onNewProject={handleStartBlender}
        />
      )}

      {state.currentView === 'blender' && (
        <BlenderViewport
          capabilityProfile={state.capabilityProfile}
        />
      )}

      <DownloadManagerUI />
      <InstallPrompt />
    </div>
  );
};

export default App;
