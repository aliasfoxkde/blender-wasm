import { Component, Show, createSignal, onCleanup } from 'solid-js';
import { pwaInstallManager } from '../platform/PWAInstall';

export const InstallPrompt: Component = () => {
  const [showPrompt, setShowPrompt] = createSignal(false);

  const cleanup = pwaInstallManager.onPromptAvailable(() => {
    setShowPrompt(true);
  });

  // Check if already installable
  if (pwaInstallManager.isInstallable()) {
    setShowPrompt(true);
  }

  onCleanup(cleanup);

  const handleInstall = async () => {
    const outcome = await pwaInstallManager.prompt();
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <Show when={showPrompt()}>
      <div class="install-prompt">
        <div class="install-content">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-primary)"/>
            <path d="M16 6L8 10v12l8 4 8-4V10l-8-4z" fill="white" opacity="0.9"/>
            <circle cx="16" cy="16" r="4" fill="var(--color-primary)"/>
          </svg>
          <div class="install-text">
            <h3>Install Blender Web Edition</h3>
            <p>Add to your home screen for quick access and offline use</p>
          </div>
        </div>
        <div class="install-actions">
          <button class="btn-secondary" onClick={handleDismiss}>
            Not now
          </button>
          <button class="btn-primary" onClick={handleInstall}>
            Install
          </button>
        </div>
      </div>

      <style>{`
        .install-prompt {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: var(--spacing-lg);
          background: var(--color-bg-light);
          border-top: 1px solid var(--color-bg-lighter);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-lg);
          animation: slideUp 0.3s ease;
          z-index: 1000;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .install-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .install-text h3 {
          margin: 0;
          font-size: var(--font-md);
          font-weight: 600;
        }

        .install-text p {
          margin: var(--spacing-xs) 0 0 0;
          font-size: var(--font-sm);
          color: var(--color-text-secondary);
        }

        .install-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .btn-secondary {
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .btn-secondary:hover {
          background: var(--color-bg-lighter);
        }

        .btn-primary {
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary);
          border-radius: var(--radius-md);
          color: white;
          font-weight: 500;
        }

        .btn-primary:hover {
          background: var(--color-primary-dark);
        }

        @media (max-width: 600px) {
          .install-prompt {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </Show>
  );
};
