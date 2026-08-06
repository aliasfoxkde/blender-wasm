import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIGateway } from './AIGateway';

describe('AIGateway', () => {
  let gateway: AIGateway;

  beforeEach(() => {
    gateway = new AIGateway();
    vi.clearAllMocks();
  });

  describe('getSceneGraph', () => {
    it('should return scene graph API', () => {
      const sg = gateway.getSceneGraph();
      expect(sg).toBeDefined();
      expect(typeof sg.getScene).toBe('function');
      expect(typeof sg.addObject).toBe('function');
    });
  });

  describe('getMaterials', () => {
    it('should return materials API', () => {
      const mat = gateway.getMaterials();
      expect(mat).toBeDefined();
      expect(typeof mat.getMaterials).toBe('function');
      expect(typeof mat.createMaterial).toBe('function');
    });
  });

  describe('getRender', () => {
    it('should return render API', () => {
      const render = gateway.getRender();
      expect(render).toBeDefined();
      expect(typeof render.render).toBe('function');
      expect(typeof render.getRenderProgress).toBe('function');
    });
  });

  describe('getAnimation', () => {
    it('should return animation API', () => {
      const anim = gateway.getAnimation();
      expect(anim).toBeDefined();
      expect(typeof anim.setFrame).toBe('function');
    });
  });

  describe('execute', () => {
    it('should return error for unknown command', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'unknown_command',
      });
      expect(response.success).toBe(false);
      expect(response.error).toContain('Unknown command');
    });
  });

  describe('executeNaturalLanguage', () => {
    it('should process natural language command', async () => {
      const response = await gateway.executeNaturalLanguage('scene.get');
      expect(response.success).toBe(true);
    });
  });

  describe('command handlers', () => {
    it('should handle scene.get', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'scene.get',
      });
      expect(response.success).toBe(true);
      expect(response.result).toEqual([]);
    });

    it('should handle scene.deselect', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'scene.deselect',
      });
      expect(response.success).toBe(true);
    });

    it('should handle material.list', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'material.list',
      });
      expect(response.success).toBe(true);
      expect(response.result).toEqual([]);
    });

    it('should handle render.progress', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'render.progress',
      });
      expect(response.success).toBe(true);
      expect(response.result).toBeDefined();
    });

    it('should require context for scene.add', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'scene.add',
      });
      expect(response.success).toBe(false);
    });

    it('should require context for object.get', async () => {
      const response = await gateway.execute({
        id: 'test',
        prompt: 'object.get',
      });
      expect(response.success).toBe(false);
    });
  });
});
