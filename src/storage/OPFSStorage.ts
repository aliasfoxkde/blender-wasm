/**
 * OPFS (Origin Private File System) storage for large files like .blend files
 */

export class OPFSStorage {
  private root: FileSystemDirectoryHandle | null = null;

  async init(): Promise<void> {
    if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
      throw new Error('OPFS is not supported in this browser');
    }
    this.root = await navigator.storage.getDirectory();
  }

  async ensureInitialized(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      await this.init();
    }
    return this.root!;
  }

  async saveBlendFile(name: string, data: ArrayBuffer): Promise<string> {
    const root = await this.ensureInitialized();

    // Create projects directory if it doesn't exist
    const projectsDir = await root.getDirectoryHandle('projects', { create: true });

    // Create individual project directory
    const projectDir = await projectsDir.getDirectoryHandle(name, { create: true });

    // Save the blend file
    const fileHandle = await projectDir.getFileHandle('scene.blend', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    return `projects/${name}/scene.blend`;
  }

  async loadBlendFile(path: string): Promise<ArrayBuffer> {
    const root = await this.ensureInitialized();
    const parts = path.split('/');
    let current: FileSystemDirectoryHandle | FileSystemFileHandle = root;

    for (let i = 0; i < parts.length - 1; i++) {
      current = await (current as FileSystemDirectoryHandle).getDirectoryHandle(parts[i]);
    }

    const fileHandle = await (current as FileSystemDirectoryHandle).getFileHandle(parts[parts.length - 1]);
    const file = await fileHandle.getFile();
    return file.arrayBuffer();
  }

  async listProjects(): Promise<string[]> {
    const root = await this.ensureInitialized();

    try {
      const projectsDir = await root.getDirectoryHandle('projects');
      const projects: string[] = [];

      for await (const entry of projectsDir.values()) {
        if (entry.kind === 'directory') {
          projects.push(entry.name);
        }
      }

      return projects;
    } catch {
      // Projects directory doesn't exist yet
      return [];
    }
  }

  async deleteProject(name: string): Promise<void> {
    const root = await this.ensureInitialized();

    try {
      const projectsDir = await root.getDirectoryHandle('projects');
      await projectsDir.removeEntry(name, { recursive: true });
    } catch {
      // Project doesn't exist
    }
  }

  async getStorageEstimate(): Promise<{ used: number; quota: number }> {
    if ('estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { used: 0, quota: 0 };
  }
}

export const opfsStorage = new OPFSStorage();
