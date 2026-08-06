/**
 * Service Worker registration and management
 */

export interface ServiceWorkerRegistration {
  register(): Promise<ServiceWorkerRegistration | undefined>;
  unregister(): Promise<boolean>;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = (this.registration as any)?.active;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available');
            }
          });
        }
      });
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await (this.registration as any)?.unregister();
      this.registration = null;
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
