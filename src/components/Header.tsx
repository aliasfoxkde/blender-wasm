import { Component, Show } from 'solid-js';
import type { CapabilityProfile } from '../core/HardwareProfiler';

interface HeaderProps {
  currentView: 'splash' | 'dashboard' | 'blender';
  onBack: () => void;
  capabilityProfile: CapabilityProfile | null;
}

export const Header: Component<HeaderProps> = (props) => {
  const getCapabilityBadge = () => {
    const profile = props.capabilityProfile;
    if (!profile) return null;

    const gpu = profile.gpu;
    if (gpu.webgpu) return { text: 'WebGPU', color: 'var(--color-success)' };
    if (gpu.webgl) return { text: 'WebGL', color: 'var(--color-warning)' };
    return { text: 'Limited', color: 'var(--color-error)' };
  };

  return (
    <header class="header">
      <div class="header-left">
        <Show when={props.currentView !== 'dashboard'}>
          <button class="back-button" onClick={props.onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        </Show>
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="var(--color-primary)"/>
            <path d="M16 6L8 10v12l8 4 8-4V10l-8-4z" fill="white" opacity="0.9"/>
            <circle cx="16" cy="16" r="4" fill="var(--color-primary)"/>
          </svg>
          <span class="logo-text">Blender Web Edition</span>
        </div>
      </div>

      <div class="header-right">
        <Show when={props.currentView === 'blender'}>
          <div class="header-status">
            <span class="status-dot online"></span>
            <span>Ready</span>
          </div>
        </Show>

        <Show when={props.capabilityProfile}>
          {(profile) => {
            const badge = getCapabilityBadge();
            return (
              <Show when={badge}>
                <span
                  class="capability-badge"
                  style={{ background: badge!.color }}
                >
                  {badge!.text}
                </span>
              </Show>
            );
          }}
        </Show>
      </div>

      <style>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          padding: 0 var(--spacing-md);
          background: var(--color-bg-darker);
          border-bottom: 1px solid var(--color-bg-lighter);
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          color: var(--color-text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .back-button:hover {
          background: var(--color-bg-lighter);
          color: var(--color-text-primary);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .logo-text {
          font-weight: 600;
          font-size: var(--font-lg);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: var(--color-text-secondary);
          font-size: var(--font-sm);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.online {
          background: var(--color-success);
        }

        .capability-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-full);
          font-size: var(--font-xs);
          font-weight: 600;
          color: white;
        }
      `}</style>
    </header>
  );
};
