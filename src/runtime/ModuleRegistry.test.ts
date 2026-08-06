import { describe, it, expect, beforeEach } from 'vitest';
import { moduleRegistry, ModuleRegistry } from './ModuleRegistry';

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    // Create fresh instance for each test
    registry = new ModuleRegistry();
  });

  describe('register', () => {
    it('should register a module', () => {
      registry.register({
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        url: '/wasm/test.wasm',
        size: 1024,
        dependencies: [],
      });

      const module = registry.get('test-module');
      expect(module).toBeDefined();
      expect(module?.name).toBe('Test Module');
      expect(module?.loaded).toBe(false);
      expect(module?.loading).toBe(false);
    });

    it('should not overwrite existing module', () => {
      registry.register({
        id: 'test-module',
        name: 'First Module',
        version: '1.0.0',
        url: '/wasm/test.wasm',
        size: 1024,
        dependencies: [],
      });

      registry.register({
        id: 'test-module',
        name: 'Second Module',
        version: '2.0.0',
        url: '/wasm/test2.wasm',
        size: 2048,
        dependencies: [],
      });

      const module = registry.get('test-module');
      expect(module?.name).toBe('First Module');
    });
  });

  describe('get', () => {
    it('should return undefined for non-existent module', () => {
      const module = registry.get('non-existent');
      expect(module).toBeUndefined();
    });
  });

  describe('isLoaded', () => {
    it('should return false for unregistered module', () => {
      expect(registry.isLoaded('non-existent')).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('should return false for unregistered module', () => {
      expect(registry.isLoading('non-existent')).toBe(false);
    });
  });

  describe('getUnmetDependencies', () => {
    it('should return empty array for non-existent module', () => {
      const deps = registry.getUnmetDependencies('non-existent');
      expect(deps).toEqual([]);
    });

    it('should return dependencies for registered module', () => {
      registry.register({
        id: 'parent',
        name: 'Parent',
        version: '1.0.0',
        url: '/wasm/parent.wasm',
        size: 1024,
        dependencies: ['child'],
      });

      registry.register({
        id: 'child',
        name: 'Child',
        version: '1.0.0',
        url: '/wasm/child.wasm',
        size: 512,
        dependencies: [],
      });

      const unmet = registry.getUnmetDependencies('parent');
      expect(unmet).toContain('child');
    });
  });

  describe('getLoadOrder', () => {
    it('should return correct load order for dependencies', () => {
      registry.register({
        id: 'main',
        name: 'Main',
        version: '1.0.0',
        url: '/wasm/main.wasm',
        size: 1024,
        dependencies: ['dep1', 'dep2'],
      });

      registry.register({
        id: 'dep1',
        name: 'Dep1',
        version: '1.0.0',
        url: '/wasm/dep1.wasm',
        size: 512,
        dependencies: ['base'],
      });

      registry.register({
        id: 'dep2',
        name: 'Dep2',
        version: '1.0.0',
        url: '/wasm/dep2.wasm',
        size: 512,
        dependencies: ['base'],
      });

      registry.register({
        id: 'base',
        name: 'Base',
        version: '1.0.0',
        url: '/wasm/base.wasm',
        size: 256,
        dependencies: [],
      });

      const order = registry.getLoadOrder('main');
      expect(order[0]).toBe('base');
      expect(order[1]).toBeOneOf(['dep1', 'dep2']);
      expect(order[2]).toBeOneOf(['dep1', 'dep2']);
      expect(order[3]).toBe('main');
    });
  });

  describe('getAll', () => {
    it('should return all registered modules', () => {
      registry.register({
        id: 'module1',
        name: 'Module 1',
        version: '1.0.0',
        url: '/wasm/module1.wasm',
        size: 1024,
        dependencies: [],
      });

      registry.register({
        id: 'module2',
        name: 'Module 2',
        version: '1.0.0',
        url: '/wasm/module2.wasm',
        size: 1024,
        dependencies: [],
      });

      const all = registry.getAll();
      expect(all.length).toBe(2);
    });
  });

  describe('getLoaded', () => {
    it('should return empty array initially', () => {
      const loaded = registry.getLoaded();
      expect(loaded).toEqual([]);
    });
  });
});
