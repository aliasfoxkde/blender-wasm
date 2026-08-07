/**
 * AI Gateway - Structured API layer for AI integration
 */

import { pluginManager } from '../plugins';

// Scene graph types
export interface SceneObject {
  id: string;
  name: string;
  type: 'mesh' | 'light' | 'camera' | 'curve' | 'armature' | 'empty';
  parent?: string;
  children: string[];
  transform: Transform;
  visible: boolean;
  locked: boolean;
}

export interface Transform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface Material {
  id: string;
  name: string;
  nodes: MaterialNode[];
}

export interface MaterialNode {
  id: string;
  type: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

export interface Mesh extends SceneObject {
  type: 'mesh';
  vertices: number;
  faces: number;
  material: string | null;
}

export interface Light extends SceneObject {
  type: 'light';
  lightType: 'sun' | 'point' | 'spot' | 'area';
  energy: number;
  color: [number, number, number];
}

export interface Camera extends SceneObject {
  type: 'camera';
  focalLength: number;
  sensorSize: [number, number];
}

// AI Command types
export interface AICommand {
  id: string;
  prompt: string;
  context?: Record<string, unknown>;
}

// Context type definitions for type-safe access
export interface SceneAddContext {
  type: SceneObject['type'];
  properties?: Partial<SceneObject>;
}

export interface SceneSelectContext {
  id: string;
}

export interface ObjectGetContext {
  id: string;
}

export interface ObjectModifyContext {
  id: string;
  changes: Partial<SceneObject>;
}

export interface ObjectDeleteContext {
  id: string;
}

export interface ObjectDuplicateContext {
  id: string;
}

export interface MaterialCreateContext {
  name: string;
}

export interface RenderStartContext {
  viewportOnly?: boolean;
}

export interface AnimationFrameContext {
  frame: number;
}

export interface AnimationKeyframeContext {
  objectId: string;
  frame: number;
  properties: string[];
}

export interface AIResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Scene Graph API
class AISceneGraph {
  async getScene(): Promise<SceneObject[]> {
    // In production, this would query the actual Blender scene
    return [];
  }

  async getObject(_id: string): Promise<SceneObject | null> {
    return null;
  }

  async addObject(_type: SceneObject['type'], _properties?: Partial<SceneObject>): Promise<SceneObject | null> {
    return null;
  }

  async removeObject(_id: string): Promise<boolean> {
    return false;
  }

  async modifyObject(_id: string, _changes: Partial<SceneObject>): Promise<boolean> {
    return false;
  }

  async selectObject(_id: string): Promise<boolean> {
    return false;
  }

  async deselectAll(): Promise<boolean> {
    return false;
  }

  async getSelectedObjects(): Promise<SceneObject[]> {
    return [];
  }

  async duplicateObject(_id: string): Promise<SceneObject | null> {
    return null;
  }

  async parentObject(_childId: string, _parentId: string | null): Promise<boolean> {
    return false;
  }
}

// Material API
class AIMaterialManager {
  async getMaterials(): Promise<Material[]> {
    return [];
  }

  async createMaterial(_name: string): Promise<Material | null> {
    return null;
  }

  async assignMaterial(_objectId: string, _materialId: string): Promise<boolean> {
    return false;
  }

  async updateMaterialNode(_materialId: string, _nodeId: string, _inputs: Record<string, unknown>): Promise<boolean> {
    return false;
  }
}

// Rendering API
class AIRenderEngine {
  async render(_viewportOnly: boolean = false): Promise<ArrayBuffer | null> {
    return null;
  }

  async setRenderSettings(_settings: RenderSettings): Promise<boolean> {
    return false;
  }

  async getRenderProgress(): Promise<{ progress: number; timeRemaining?: number }> {
    return { progress: 0 };
  }

  async cancelRender(): Promise<void> {}
}

export interface RenderSettings {
  engine: 'eevee' | 'cycles';
  samples: number;
  resolution: [number, number];
  device: 'cpu' | 'gpu';
}

// Animation API
class AIAnimation {
  async getKeyframes(_frame: number): Promise<unknown[]> {
    return [];
  }

  async setKeyframe(_objectId: string, _frame: number, _properties: string[]): Promise<boolean> {
    return false;
  }

  async play(_start: number, _end: number): Promise<void> {}

  async stop(): Promise<void> {}

  async setFrame(_frame: number): Promise<void> {}
}

// Main AI Gateway
class AIGateway {
  private sceneGraph: AISceneGraph;
  private materials: AIMaterialManager;
  private render: AIRenderEngine;
  private animation: AIAnimation;
  private commandHandlers: Map<string, (command: AICommand) => Promise<AIResponse>>;

  constructor() {
    this.sceneGraph = new AISceneGraph();
    this.materials = new AIMaterialManager();
    this.render = new AIRenderEngine();
    this.animation = new AIAnimation();
    this.commandHandlers = new Map();
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    // Scene operations
    this.registerHandler('scene.get', async (_cmd) => ({
      success: true,
      result: await this.sceneGraph.getScene()
    }));

    this.registerHandler('scene.add', async (cmd) => {
      const ctx = cmd.context as SceneAddContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const obj = await this.sceneGraph.addObject(ctx.type, ctx.properties);
      return { success: !!obj, result: obj };
    });

    this.registerHandler('scene.select', async (cmd) => {
      const ctx = cmd.context as SceneSelectContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const success = await this.sceneGraph.selectObject(ctx.id);
      return { success };
    });

    this.registerHandler('scene.deselect', async () => {
      await this.sceneGraph.deselectAll();
      return { success: true };
    });

    // Object operations
    this.registerHandler('object.get', async (cmd) => {
      const ctx = cmd.context as ObjectGetContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const obj = await this.sceneGraph.getObject(ctx.id);
      return { success: !!obj, result: obj };
    });

    this.registerHandler('object.modify', async (cmd) => {
      const ctx = cmd.context as ObjectModifyContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const success = await this.sceneGraph.modifyObject(ctx.id, ctx.changes);
      return { success };
    });

    this.registerHandler('object.delete', async (cmd) => {
      const ctx = cmd.context as ObjectDeleteContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const success = await this.sceneGraph.removeObject(ctx.id);
      return { success };
    });

    this.registerHandler('object.duplicate', async (cmd) => {
      const ctx = cmd.context as ObjectDuplicateContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const obj = await this.sceneGraph.duplicateObject(ctx.id);
      return { success: !!obj, result: obj };
    });

    // Material operations
    this.registerHandler('material.list', async () => ({
      success: true,
      result: await this.materials.getMaterials()
    }));

    this.registerHandler('material.create', async (cmd) => {
      const ctx = cmd.context as MaterialCreateContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const mat = await this.materials.createMaterial(ctx.name);
      return { success: !!mat, result: mat };
    });

    // Render operations
    this.registerHandler('render.start', async (cmd) => {
      const ctx = cmd.context as RenderStartContext | undefined;
      const viewportOnly = ctx?.viewportOnly ?? false;
      const result = await this.render.render(viewportOnly);
      return { success: !!result, result: result ? 'rendered' : null };
    });

    this.registerHandler('render.progress', async () => ({
      success: true,
      result: await this.render.getRenderProgress()
    }));

    // Animation operations
    this.registerHandler('animation.frame', async (cmd) => {
      const ctx = cmd.context as AnimationFrameContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      await this.animation.setFrame(ctx.frame);
      return { success: true };
    });

    this.registerHandler('animation.keyframe', async (cmd) => {
      const ctx = cmd.context as AnimationKeyframeContext | undefined;
      if (!ctx) return { success: false, error: 'Missing context' };
      const success = await this.animation.setKeyframe(ctx.objectId, ctx.frame, ctx.properties);
      return { success };
    });
  }

  registerHandler(command: string, handler: (cmd: AICommand) => Promise<AIResponse>): void {
    this.commandHandlers.set(command, handler);
  }

  async execute(command: AICommand): Promise<AIResponse> {
    // First try built-in handlers
    const handler = this.commandHandlers.get(command.prompt.toLowerCase());
    if (handler) {
      return handler(command);
    }

    // Try plugin handlers
    try {
      return await pluginManager.handleAICommand(command);
    } catch {
      // No plugin handled it
    }

    return { success: false, error: `Unknown command: ${command.prompt}` };
  }

  async executeNaturalLanguage(prompt: string, context?: Record<string, unknown>): Promise<AIResponse> {
    const command: AICommand = {
      id: crypto.randomUUID(),
      prompt,
      context,
    };
    return this.execute(command);
  }

  // API accessors
  getSceneGraph(): AISceneGraph {
    return this.sceneGraph;
  }

  getMaterials(): AIMaterialManager {
    return this.materials;
  }

  getRender(): AIRenderEngine {
    return this.render;
  }

  getAnimation(): AIAnimation {
    return this.animation;
  }
}

export const aiGateway = new AIGateway();
