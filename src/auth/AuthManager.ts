/**
 * Authentication Manager - Handles auth modes: Guest, Local, Cloud
 */

import { profileStorage, type UserProfile } from '../storage/ProfileStorage';

export type { UserProfile };

export type AuthMode = 'guest' | 'local' | 'cloud';
export type AuthProvider = 'anonymous' | 'local' | 'github' | 'google';

export interface AuthState {
  mode: AuthMode;
  provider: AuthProvider;
  isAuthenticated: boolean;
  profile: UserProfile | null;
}

interface AuthListener {
  (state: AuthState): void;
}

class AuthManager {
  private state: AuthState = {
    mode: 'guest',
    provider: 'anonymous',
    isAuthenticated: false,
    profile: null,
  };
  private listeners: Set<AuthListener> = new Set();

  async init(): Promise<void> {
    // Try to restore previous session
    const profile = await profileStorage.getActiveProfile();
    if (profile) {
      this.state = {
        mode: profile.syncEnabled ? 'cloud' : 'local',
        // 'cloud' mode uses 'local' as the auth provider placeholder since we don't track which OAuth was used
        provider: 'local',
        isAuthenticated: true,
        profile,
      };
    }
  }

  getState(): AuthState {
    return { ...this.state };
  }

  onAuthChange(listener: AuthListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((cb) => cb(currentState));
  }

  async continueAsGuest(): Promise<void> {
    this.state = {
      mode: 'guest',
      provider: 'anonymous',
      isAuthenticated: false,
      profile: null,
    };
    this.notifyListeners();
  }

  async createLocalProfile(name: string): Promise<UserProfile> {
    const profile = await profileStorage.createProfile(name);
    await profileStorage.setActiveProfile(profile.id);

    this.state = {
      mode: 'local',
      provider: 'local',
      isAuthenticated: true,
      profile,
    };

    this.notifyListeners();
    return profile;
  }

  async switchProfile(profileId: string): Promise<void> {
    const profile = await profileStorage.getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    await profileStorage.setActiveProfile(profileId);

    this.state = {
      mode: profile.syncEnabled ? 'cloud' : 'local',
      // 'cloud' mode uses 'local' as the auth provider placeholder since we don't track which OAuth was used
      provider: 'local',
      isAuthenticated: true,
      profile,
    };

    this.notifyListeners();
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.state.profile) return;

    await profileStorage.updateProfile(this.state.profile.id, updates);
    this.state.profile = await profileStorage.getProfile(this.state.profile.id) || null;
    this.notifyListeners();
  }

  async signOut(): Promise<void> {
    if (this.state.profile) {
      await profileStorage.setActiveProfile(null);
    }

    this.state = {
      mode: 'guest',
      provider: 'anonymous',
      isAuthenticated: false,
      profile: null,
    };

    this.notifyListeners();
  }

  async deleteProfile(profileId: string): Promise<void> {
    await profileStorage.deleteProfile(profileId);

    if (this.state.profile?.id === profileId) {
      await this.signOut();
    }
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    return profileStorage.getAllProfiles();
  }

  async linkCloud(provider: AuthProvider): Promise<void> {
    // In a real implementation, this would initiate OAuth flow
    if (!this.state.profile) {
      throw new Error('No active profile to link');
    }

    // Simulate cloud linking
    await profileStorage.updateProfile(this.state.profile.id, {
      syncEnabled: true,
      lastSyncedAt: new Date(),
    });

    this.state.mode = 'cloud';
    this.state.provider = provider;
    this.state.profile = await profileStorage.getProfile(this.state.profile.id) || null;
    this.notifyListeners();
  }

  async unlinkCloud(): Promise<void> {
    if (!this.state.profile) return;

    await profileStorage.updateProfile(this.state.profile.id, {
      syncEnabled: false,
    });

    this.state.mode = 'local';
    this.state.provider = 'local';
    this.state.profile = await profileStorage.getProfile(this.state.profile.id) || null;
    this.notifyListeners();
  }

  isGuest(): boolean {
    return this.state.mode === 'guest';
  }

  isLocal(): boolean {
    return this.state.mode === 'local';
  }

  isCloud(): boolean {
    return this.state.mode === 'cloud';
  }

  getProfile(): UserProfile | null {
    return this.state.profile;
  }
}

export const authManager = new AuthManager();
