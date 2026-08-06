import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';

export const OfflineIndicator: Component = () => {
  const [isOnline, setIsOnline] = createSignal(navigator.onLine);

  onMount(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    onCleanup(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  });

  return (
    <Show when={!isOnline()}>
      <div class="offline-indicator">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
        </svg>
        <span>You're offline</span>
        <span class="offline-hint">Some features may be limited</span>

        <style>{`
          .offline-indicator {
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-warning);
            color: var(--color-bg-darker);
            border-radius: var(--radius-full);
            font-size: var(--font-sm);
            font-weight: 500;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
          }

          .offline-hint {
            opacity: 0.8;
            font-weight: 400;
          }
        `}</style>
      </div>
    </Show>
  );
};
