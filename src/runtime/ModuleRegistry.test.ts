import { describe, it, expect, beforeEach } from 'vitest';
import { moduleRegistry } from './ModuleRegistry';

describe('ModuleRegistry', () => {
  beforeEach(() => {
    // Clear all registered modules before each test
    moduleRegistry.getAll().forEach(m => {
      // Can't actually remove, but tests should use unique IDs
    });
  });

  describe('register', () => {
    it('should register a module', () => {
      moduleRegistry.register({
        id: 'test-module-' + Date.now(),
        name: 'Test Module',
        version: '1.0.0',
        url: '/wasm/test.wasm',
        size: 1024,
        dependencies: [],
      });

      const id = 'test-module-' + Date.now();
      moduleRegistry.register({
        id,
        name: 'Test Module',
        version: '1.0.0',
        url: '/wasm/test.wasm',
        size: 1024,
        dependencies: [],
      });

      const module = moduleRegistry.get(id);
      expect(module).toBeDefined();
      expect(module?.name).toBe('Test Module');
      expect(module?.loaded).toBe(false);
      expect(module?.loading).toBe(false);
    });

    it('should update existing module when re-registered', () => {
      const id = 'test-module-overwrite-' + Date.now();
      moduleRegistry.register({
        id,
        name: 'First Module',
        version: '1.0.0',
        url: '/wasm/test.wasm',
        size: 1024,
        dependencies: [],
      });

      moduleRegistry.register({
        id,
        name: 'Second Module',
        version: '2.0.0',
        url: '/wasm/test2.wasm',
        size: 2048,
        dependencies: [],
      });

      // Module gets updated with the new data
      const module = moduleRegistry.get(id);
      expect(module?.name).toBe('Second Module');
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent module', () => {
      const module = moduleRegistry.get('non-existent-' + Date.now());
      expect(module).toBeUndefined();
    });
  });

  describe('isLoaded', () => {
    it('should return false for unregistered module', () => {
      expect(moduleRegistry.isLoaded('non-existent-' + Date.now())).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return false for unregistered module', () => {
      expect(moduleRegistry.isLoading('non-existent-' + Date.now())).toBe(false);
    });
  });

  describe('getUnmetDependencies', () => {
    it('should return empty array for non-existent module', () => {
      const deps = moduleRegistry.getUnmetDependencies('non-existent-' + Date.now());
      expect(deps).toEqual([]);
    });

    it('should return dependencies for registered module', () => {
      const parentId = 'parent-' + Date.now();
      const childId = 'child-' + Date.now();

      moduleRegistry.register({
        id: parentId,
        name: 'Parent',
        version: '1.0.0',
        url: '/wasm/parent.wasm',
        size: 1024,
        dependencies: [childId],
      });

      moduleRegistry.register({
        id: childId,
        name: 'Child',
        version: '1.0.0',
        url: '/wasm/child.wasm',
        size: 512,
        dependencies: [],
      });

      const unmet = moduleRegistry.getUnmetDependencies(parentId);
      expect(unmet).toContain(childId);
    });
  });

  describe('getLoadOrder', () => {
    it('should return correct load order for dependencies', () => {
      const mainId = 'main-' + Date.now();
      const dep1Id = 'dep1-' + Date.now();
      const dep2Id = 'dep2-' + Date.now();
      const baseId = 'base-' + Date.now();

      moduleRegistry.register({
        id: mainId,
        name: 'Main',
        version: '1.0.0',
        url: '/wasm/main.wasm',
        size: 1024,
        dependencies: [dep1Id, dep2Id],
      });

      moduleRegistry.register({
        id: dep1Id,
        name: 'Dep1',
        version: '1.0.0',
        url: '/wasm/dep1.wasm',
        size: 512,
        dependencies: [baseId],
      });

      moduleRegistry.register({
        id: dep2Id,
        name: 'Dep2',
        version: '1.0.0',
        url: '/wasm/dep2.wasm',
        size: 512,
        dependencies: [baseId],
      });

      moduleRegistry.register({
        id: baseId,
        name: 'Base',
        version: '1.0.0',
        url: '/wasm/base.wasm',
        size: 256,
        dependencies: [],
      });

      const order = moduleRegistry.getLoadOrder(mainId);
      expect(order[0]).toBe(baseId);
      expect(order).toContain(dep1Id);
      expect(order).toContain(dep2Id);
      expect(order[order.length - 1]).toBe(mainId);
    });
  });

  describe('getAll', () => {
    it('should return all registered modules', () => {
      const id1 = 'module1-' + Date.now();
      const id2 = 'module2-' + Date.now();

      moduleRegistry.register({
        id: id1,
        name: 'Module 1',
        version: '1.0.0',
        url: '/wasm/module1.wasm',
        size: 1024,
        dependencies: [],
      });

      moduleRegistry.register({
        id: id2,
        name: 'Module 2',
        version: '1.0.0',
        url: '/wasm/module2.wasm',
        size: 1024,
        dependencies: [],
      });

      const all = moduleRegistry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getLoaded', () => {
    it('should return empty array initially', () => {
      const loaded = moduleRegistry.getLoaded();
      expect(loaded).toEqual([]);
    });
  });
});
