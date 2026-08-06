import { Component, createEffect, onCleanup } from 'solid-js';

interface SplashProps {
  progress: number;
  onComplete: () => void;
}

export const Splash: Component<SplashProps> = (props) => {
  let progressRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (progressRef && props.progress >= 100) {
      const timer = setTimeout(() => {
        props.onComplete();
      }, 500);
      onCleanup(() => clearTimeout(timer));
    }
  });

  return (
    <div class="splash">
      <div class="splash-content">
        <div class="splash-logo">
          <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-primary)"/>
            <path d="M16 6L8 10v12l8 4 8-4V10l-8-4z" fill="white" opacity="0.9"/>
            <circle cx="16" cy="16" r="4" fill="var(--color-primary)"/>
          </svg>
        </div>

        <h1 class="splash-title">Blender Web Edition</h1>
        <p class="splash-subtitle">Loading...</p>

        <div class="progress-container" ref={progressRef}>
          <div class="progress-bar">
            <div
              class="progress-fill"
              style={{ width: `${props.progress}%` }}
            />
          </div>
          <span class="progress-text">{props.progress}%</span>
        </div>

        <div class="splash-tips">
          <p>Tip: For the best experience, use Chrome or Edge</p>
        </div>
      </div>

      <style>{`
        .splash {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-dark);
          background-image:
            radial-gradient(circle at 50% 0%, rgba(255, 140, 0, 0.15) 0%, transparent 50%);
        }

        .splash-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-2xl);
        }

        .splash-logo {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }

        .splash-title {
          font-size: var(--font-2xl);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }

        .splash-subtitle {
          font-size: var(--font-md);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .progress-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          width: 300px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--color-bg-lighter);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width var(--transition-fast);
        }

        .progress-text {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
          font-family: monospace;
        }

        .splash-tips {
          margin-top: var(--spacing-xl);
        }

        .splash-tips p {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
};
