/**
 * PWA Install prompt manager
 */

export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAInstallManager {
  private deferredPrompt: PWAInstallPromptEvent | null = null;
  private onPromptListeners: Array<() => void> = [];

  init(): void {
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPromptEvent;
      this.onPromptListeners.forEach(listener => listener());
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      console.log('PWA installed successfully');
    });
  }

  async prompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return outcome;
  }

  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  onPromptAvailable(callback: () => void): () => void {
    this.onPromptListeners.push(callback);
    return () => {
      const index = this.onPromptListeners.indexOf(callback);
      if (index > -1) {
        this.onPromptListeners.splice(index, 1);
      }
    };
  }
}

export const pwaInstallManager = new PWAInstallManager();
