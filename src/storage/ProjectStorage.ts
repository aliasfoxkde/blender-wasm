import { openDB, type IDBPDatabase } from 'idb';

interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  created: Date;
  thumbnail?: string;
  size?: number;
}

interface ProjectDB {
  projects: Project;
  settings: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'blender-wasm';
const DB_VERSION = 1;

export class ProjectStorage {
  private db: IDBPDatabase<ProjectDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<ProjectDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', {
            keyPath: 'id',
          });
          projectStore.createIndex('lastOpened', 'lastOpened');
          projectStore.createIndex('name', 'name');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', {
            keyPath: 'key',
          });
        }
      },
    });
  }

  async getRecentProjects(limit = 10): Promise<Project[]> {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('projects', 'readonly');
    const index = tx.store.index('lastOpened');
    const projects = await index.getAll();
    return projects.reverse().slice(0, limit);
  }

  async addProject(project: Omit<Project, 'id' | 'created'>): Promise<Project> {
    if (!this.db) await this.init();
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      created: new Date(),
    };
    await this.db!.add('projects', newProject);
    return newProject;
  }

  async updateLastOpened(id: string): Promise<void> {
    if (!this.db) await this.init();
    const project = await this.db!.get('projects', id);
    if (project) {
      project.lastOpened = new Date();
      await this.db!.put('projects', project);
    }
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('projects', id);
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    const result = await this.db!.get('settings', key);
    return result?.value as T | undefined;
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put('settings', { key, value });
  }
}

export const projectStorage = new ProjectStorage();
