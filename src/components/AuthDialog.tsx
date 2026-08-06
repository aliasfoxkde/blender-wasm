import { Component, Show, For, createSignal } from 'solid-js';
import { authManager, type AuthState, type UserProfile } from '../auth';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthDialog: Component<AuthDialogProps> = (props) => {
  const [mode, setMode] = createSignal<'choose' | 'create' | 'profiles'>('choose');
  const [newProfileName, setNewProfileName] = createSignal('');
  const [profiles, setProfiles] = createSignal<UserProfile[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);

  const loadProfiles = async () => {
    const allProfiles = await authManager.getAllProfiles();
    setProfiles(allProfiles);
  };

  const handleCreateProfile = async () => {
    const name = newProfileName().trim();
    if (!name) return;

    setIsLoading(true);
    try {
      await authManager.createLocalProfile(name);
      props.onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = async (profile: UserProfile) => {
    setIsLoading(true);
    try {
      await authManager.switchProfile(profile.id);
      props.onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async (profile: UserProfile) => {
    if (confirm(`Delete profile "${profile.name}"? This cannot be undone.`)) {
      await authManager.deleteProfile(profile.id);
      loadProfiles();
    }
  };

  const handleContinueAsGuest = async () => {
    await authManager.continueAsGuest();
    props.onClose();
  };

  // Load profiles when opening profiles view
  const openProfiles = async () => {
    await loadProfiles();
    setMode('profiles');
  };

  return (
    <Show when={props.isOpen}>
      <div class="auth-overlay" onClick={() => props.onClose()}>
        <div class="auth-dialog" onClick={(e) => e.stopPropagation()}>
          <button class="close-btn" onClick={() => props.onClose()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Choose Mode */}
          <Show when={mode() === 'choose'}>
            <div class="auth-header">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="var(--color-primary)"/>
                <path d="M16 6L8 10v12l8 4 8-4V10l-8-4z" fill="white" opacity="0.9"/>
                <circle cx="16" cy="16" r="4" fill="var(--color-primary)"/>
              </svg>
              <h2>Welcome to Blender Web</h2>
              <p>Choose how you want to continue</p>
            </div>

            <div class="auth-options">
              <button class="auth-option" onClick={handleContinueAsGuest}>
                <span class="option-icon">👤</span>
                <span class="option-title">Continue as Guest</span>
                <span class="option-desc">No account needed, projects stored locally</span>
              </button>

              <button class="auth-option" onClick={() => setMode('create')}>
                <span class="option-icon">📁</span>
                <span class="option-title">Create Local Profile</span>
                <span class="option-desc">Save projects and settings to this device</span>
              </button>

              <button class="auth-option" onClick={openProfiles}>
                <span class="option-icon">🔄</span>
                <span class="option-title">Switch Profile</span>
                <span class="option-desc">Use an existing local profile</span>
              </button>

              <button class="auth-option cloud" disabled>
                <span class="option-icon">☁️</span>
                <span class="option-title">Sign in with Cloud</span>
                <span class="option-desc">Coming soon - sync across devices</span>
              </button>
            </div>
          </Show>

          {/* Create Profile */}
          <Show when={mode() === 'create'}>
            <div class="auth-header">
              <h2>Create Profile</h2>
              <p>Enter a name for your local profile</p>
            </div>

            <div class="auth-form">
              <input
                type="text"
                placeholder="Profile name"
                value={newProfileName()}
                onInput={(e) => setNewProfileName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              />

              <div class="form-actions">
                <button class="btn-secondary" onClick={() => setMode('choose')}>
                  Back
                </button>
                <button
                  class="btn-primary"
                  onClick={handleCreateProfile}
                  disabled={!newProfileName().trim() || isLoading()}
                >
                  {isLoading() ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </Show>

          {/* Profile List */}
          <Show when={mode() === 'profiles'}>
            <div class="auth-header">
              <h2>Switch Profile</h2>
              <p>Select a profile or create a new one</p>
            </div>

            <Show when={profiles().length > 0}>
              <div class="profile-list">
                <For each={profiles()}>
                  {(profile) => (
                    <div class="profile-item">
                      <button
                        class="profile-select"
                        onClick={() => handleSelectProfile(profile)}
                      >
                        <span class="profile-avatar">
                          {profile.name[0].toUpperCase()}
                        </span>
                        <span class="profile-info">
                          <span class="profile-name">{profile.name}</span>
                          <span class="profile-meta">
                            {profile.syncEnabled ? '☁️ Synced' : '💾 Local'}
                          </span>
                        </span>
                      </button>
                      <button
                        class="profile-delete"
                        onClick={() => handleDeleteProfile(profile)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>

            <Show when={profiles().length === 0}>
              <p class="no-profiles">No profiles found</p>
            </Show>

            <div class="form-actions">
              <button class="btn-secondary" onClick={() => setMode('choose')}>
                Back
              </button>
              <button class="btn-primary" onClick={() => setMode('create')}>
                Create New
              </button>
            </div>
          </Show>
        </div>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .auth-dialog {
          background: var(--color-bg-light);
          border-radius: var(--radius-lg);
          padding: var(--spacing-xl);
          max-width: 400px;
          width: 90%;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          background: transparent;
          color: var(--color-text-muted);
          padding: var(--spacing-xs);
          border-radius: var(--radius-md);
        }

        .close-btn:hover {
          background: var(--color-bg-lighter);
          color: var(--color-text-primary);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .auth-header svg {
          margin-bottom: var(--spacing-md);
        }

        .auth-header h2 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-xl);
        }

        .auth-header p {
          margin: 0;
          color: var(--color-text-secondary);
        }

        .auth-options {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .auth-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-lg);
          background: var(--color-bg-darker);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          text-align: center;
          transition: all var(--transition-fast);
        }

        .auth-option:hover:not(:disabled) {
          border-color: var(--color-primary);
          transform: translateY(-2px);
        }

        .auth-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-option.cloud {
          opacity: 0.7;
        }

        .option-icon {
          font-size: 32px;
        }

        .option-title {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .option-desc {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .auth-form input {
          padding: var(--spacing-md);
          background: var(--color-bg-darker);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          color: var(--color-text-primary);
          font-size: var(--font-md);
        }

        .auth-form input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: flex-end;
        }

        .btn-secondary {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--color-bg-lighter);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
        }

        .btn-secondary:hover {
          background: var(--color-bg-darker);
        }

        .btn-primary {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--color-primary);
          border-radius: var(--radius-md);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .btn-primary:disabled {
          opacity: 0.5;
        }

        .profile-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .profile-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .profile-select {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-bg-darker);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          text-align: left;
        }

        .profile-select:hover {
          border-color: var(--color-primary);
        }

        .profile-avatar {
          width: 40px;
          height: 40px;
          background: var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
        }

        .profile-name {
          font-weight: 500;
        }

        .profile-meta {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .profile-delete {
          padding: var(--spacing-sm);
          background: transparent;
          color: var(--color-text-muted);
          border-radius: var(--radius-md);
        }

        .profile-delete:hover {
          background: var(--color-error);
          color: white;
        }

        .no-profiles {
          text-align: center;
          color: var(--color-text-muted);
          padding: var(--spacing-xl);
        }
      `}</style>
    </Show>
  );
};
