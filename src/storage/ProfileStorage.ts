/**
 * User Profile Storage - Local profiles with optional cloud sync
 */

import { openDB, type IDBPDatabase } from 'idb';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  lastActive: Date;
  syncEnabled: boolean;
  lastSyncedAt?: Date;
}

interface ProfileDB {
  profiles: UserProfile;
  activeProfile: { id: string };
}

const DB_NAME = 'blender-wasm-profiles';
const DB_VERSION = 1;

class ProfileStorage {
  private db: IDBPDatabase<ProfileDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<ProfileDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          const store = db.createObjectStore('profiles', {
            keyPath: 'id',
          });
          store.createIndex('name', 'name');
          store.createIndex('lastActive', 'lastActive');
        }

        if (!db.objectStoreNames.contains('activeProfile')) {
          db.createObjectStore('activeProfile', {
            keyPath: 'id',
          });
        }
      },
    });
  }

  async ensureInitialized(): Promise<IDBPDatabase<ProfileDB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  async createProfile(name: string): Promise<UserProfile> {
    const db = await this.ensureInitialized();

    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name,
      settings: {},
      createdAt: new Date(),
      lastActive: new Date(),
      syncEnabled: false,
    };

    await db.add('profiles', profile);
    return profile;
  }

  async getProfile(id: string): Promise<UserProfile | undefined> {
    const db = await this.ensureInitialized();
    return db.get('profiles', id);
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    const db = await this.ensureInitialized();
    return db.getAll('profiles');
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<void> {
    const db = await this.ensureInitialized();
    const profile = await db.get('profiles', id);
    if (profile) {
      Object.assign(profile, updates, { lastActive: new Date() });
      await db.put('profiles', profile);
    }
  }

  async deleteProfile(id: string): Promise<void> {
    const db = await this.ensureInitialized();
    await db.delete('profiles', id);

    // If deleted profile was active, clear active profile
    const active = await this.getActiveProfile();
    if (active?.id === id) {
      await this.setActiveProfile(null);
    }
  }

  async setActiveProfile(id: string | null): Promise<void> {
    const db = await this.ensureInitialized();

    // Clear existing active
    const tx = db.transaction('activeProfile', 'readwrite');
    await tx.store.clear();

    // Set new active
    if (id) {
      await tx.store.put({ id });

      // Update last active time
      await this.updateProfile(id, { lastActive: new Date() });
    }

    await tx.done;
  }

  async getActiveProfile(): Promise<UserProfile | null> {
    const db = await this.ensureInitialized();
    const active = await db.get('activeProfile', 'id');
    if (!active) return null;
    return this.getProfile(active.id) || null;
  }

  async updateSettings(profileId: string, settings: Record<string, unknown>): Promise<void> {
    const profile = await this.getProfile(profileId);
    if (profile) {
      profile.settings = { ...profile.settings, ...settings };
      await this.updateProfile(profileId, { settings: profile.settings });
    }
  }

  async exportProfile(profileId: string): Promise<string> {
    const profile = await this.getProfile(profileId);
    if (!profile) throw new Error('Profile not found');
    return JSON.stringify(profile, null, 2);
  }

  async importProfile(jsonString: string): Promise<UserProfile> {
    const data = JSON.parse(jsonString);
    const profile: UserProfile = {
      id: crypto.randomUUID(), // New ID to avoid conflicts
      name: data.name,
      avatar: data.avatar,
      settings: data.settings || {},
      createdAt: new Date(),
      lastActive: new Date(),
      syncEnabled: false,
    };

    const db = await this.ensureInitialized();
    await db.add('profiles', profile);
    return profile;
  }
}

export const profileStorage = new ProfileStorage();
