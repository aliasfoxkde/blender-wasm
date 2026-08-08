/**
 * Service Worker registration and management
 */

export interface ServiceWorkerRegistration {
  register(): Promise<ServiceWorkerRegistration | undefined>;
  unregister(): Promise<boolean>;
}

interface InternalRegistration extends ServiceWorkerRegistration {
  active?: ServiceWorker;
  addEventListener?: (type: string, listener: () => void) => void;
}

class ServiceWorkerManager {
  private registration: InternalRegistration | null = null;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      }) as unknown as InternalRegistration;

      // Handle updates
      this.registration.addEventListener?.('updatefound', () => {
        const newWorker = this.registration?.active;
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
      await this.registration.unregister();
      this.registration = null;
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();
