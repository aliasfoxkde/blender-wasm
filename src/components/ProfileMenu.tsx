import { Component, Show, createSignal, onMount } from 'solid-js';
import { authManager, type AuthState } from '../auth';

interface ProfileMenuProps {
  onOpenSettings: () => void;
}

export const ProfileMenu: Component<ProfileMenuProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [authState, setAuthState] = createSignal<AuthState>(authManager.getState());

  onMount(() => {
    authManager.onAuthChange((state) => setAuthState(state));
  });

  const handleSignOut = async () => {
    await authManager.signOut();
    setIsOpen(false);
  };

  const getDisplayName = () => {
    const profile = authState().profile;
    if (profile) return profile.name;
    return 'Guest';
  };

  const getModeLabel = () => {
    switch (authState().mode) {
      case 'guest': return 'Guest Mode';
      case 'local': return 'Local Profile';
      case 'cloud': return 'Cloud Synced';
      default: return '';
    }
  };

  return (
    <div class="profile-menu">
      <button class="profile-trigger" onClick={() => setIsOpen(!isOpen())}>
        <Show
          when={authState().profile}
          fallback={
            <div class="avatar guest">👤</div>
          }
        >
          <div class="avatar">
            {authState().profile?.name[0].toUpperCase()}
          </div>
        </Show>
        <div class="profile-info">
          <span class="profile-name">{getDisplayName()}</span>
          <span class="profile-mode">{getModeLabel()}</span>
        </div>
        <svg
          class={`chevron ${isOpen() ? 'open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <Show when={isOpen()}>
        <div class="profile-dropdown">
          <Show when={authState().profile}>
            <div class="dropdown-section">
              <button class="dropdown-item" onClick={() => { props.onOpenSettings(); setIsOpen(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v10M1 12h6m6 0h10"/>
                </svg>
                Settings
              </button>
              <button class="dropdown-item" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Profile
              </button>
            </div>

            <Show when={authState().mode !== 'cloud'}>
              <div class="dropdown-divider" />
              <div class="dropdown-section">
                <button class="dropdown-item" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Enable Cloud Sync
                  <span class="badge">Soon</span>
                </button>
              </div>
            </Show>

            <div class="dropdown-divider" />
            <div class="dropdown-section">
              <button class="dropdown-item danger" onClick={handleSignOut}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
          </Show>

          <Show when={!authState().profile}>
            <div class="dropdown-section">
              <button class="dropdown-item primary" disabled>
                <span>Sign In</span>
                <span class="badge">Soon</span>
              </button>
            </div>
          </Show>
        </div>
      </Show>

      <style>{`
        .profile-menu {
          position: relative;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-full);
          color: var(--color-text-primary);
          transition: all var(--transition-fast);
        }

        .profile-trigger:hover {
          background: var(--color-bg-lighter);
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: var(--font-sm);
        }

        .avatar.guest {
          background: var(--color-bg-lighter);
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .profile-name {
          font-weight: 500;
          font-size: var(--font-sm);
        }

        .profile-mode {
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }

        .chevron {
          transition: transform var(--transition-fast);
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + var(--spacing-sm));
          right: 0;
          min-width: 200px;
          background: var(--color-bg-light);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-lg);
          padding: var(--spacing-sm);
          box-shadow: var(--shadow-lg);
          z-index: 100;
        }

        .dropdown-section {
          display: flex;
          flex-direction: column;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--color-bg-lighter);
          margin: var(--spacing-sm) 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--font-sm);
          text-align: left;
          transition: all var(--transition-fast);
        }

        .dropdown-item:hover:not(:disabled) {
          background: var(--color-bg-lighter);
          color: var(--color-text-primary);
        }

        .dropdown-item.danger:hover {
          background: var(--color-error);
          color: white;
        }

        .dropdown-item.primary {
          background: var(--color-primary);
          color: white;
          justify-content: center;
        }

        .dropdown-item .badge {
          margin-left: auto;
          padding: 2px var(--spacing-sm);
          background: var(--color-bg-darker);
          border-radius: var(--radius-full);
          font-size: var(--font-xs);
          color: var(--color-text-muted);
        }

        .dropdown-item.primary .badge {
          background: rgba(255,255,255,0.2);
          color: white;
        }
      `}</style>
    </div>
  );
};
