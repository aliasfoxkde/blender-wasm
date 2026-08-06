/**
 * Built-in Plugin Registry
 */

import { pluginManager, type PluginManifest } from './PluginManager';

// Official plugins that ship with Blender Web
const BUILTIN_PLUGINS: PluginManifest[] = [
  {
    id: 'io-obj',
    name: 'OBJ Import/Export',
    version: '1.0.0',
    description: 'Import and export Wavefront OBJ files',
    author: 'Blender Web',
    permissions: [
      { type: 'filesystem', access: 'read' },
      { type: 'filesystem', access: 'write' },
      { type: 'scene', access: 'write' },
    ],
    assets: ['/wasm/blender_obj.wasm'],
    entrypoint: '/plugins/io-obj/index.js',
  },
  {
    id: 'io-fbx',
    name: 'FBX Import/Export',
    version: '1.0.0',
    description: 'Import and export Autodesk FBX files',
    author: 'Blender Web',
    permissions: [
      { type: 'filesystem', access: 'read' },
      { type: 'filesystem', access: 'write' },
      { type: 'scene', access: 'write' },
    ],
    assets: ['/wasm/blender_fbx.wasm'],
    entrypoint: '/plugins/io-fbx/index.js',
  },
  {
    id: 'io-usd',
    name: 'USD Import/Export',
    version: '1.0.0',
    description: 'Import and export Pixar USD files',
    author: 'Blender Web',
    permissions: [
      { type: 'filesystem', access: 'read' },
      { type: 'filesystem', access: 'write' },
      { type: 'scene', access: 'write' },
    ],
    assets: ['/wasm/blender_usd.wasm'],
    entrypoint: '/plugins/io-usd/index.js',
  },
  {
    id: 'ai-assist',
    name: 'AI Assistant',
    version: '1.0.0',
    description: 'AI-powered assistance for modeling and animation',
    author: 'Blender Web',
    permissions: [
      { type: 'ai', access: 'execute' },
      { type: 'scene', access: 'read' },
      { type: 'scene', access: 'write' },
    ],
    entrypoint: '/plugins/ai-assist/index.js',
  },
  {
    id: 'asset-browser',
    name: 'Asset Browser',
    version: '1.0.0',
    description: 'Browse and import assets from libraries',
    author: 'Blender Web',
    permissions: [
      { type: 'network', access: 'read' },
      { type: 'filesystem', access: 'read' },
      { type: 'scene', access: 'write' },
    ],
    entrypoint: '/plugins/asset-browser/index.js',
  },
  {
    id: 'render-cycles',
    name: 'Cycles Renderer',
    version: '1.0.0',
    description: 'GPU-accelerated path tracer',
    author: 'Blender Web',
    permissions: [
      { type: 'scene', access: 'read' },
      { type: 'filesystem', access: 'write' },
    ],
    assets: ['/wasm/blender_cycles.wasm'],
    entrypoint: '/plugins/render-cycles/index.js',
  },
];

export async function registerBuiltinPlugins(): Promise<void> {
  for (const manifest of BUILTIN_PLUGINS) {
    await pluginManager.registerFromManifest(manifest);
  }
  console.log(`Registered ${BUILTIN_PLUGINS.length} built-in plugins`);
}

export function getBuiltinPluginManifests(): PluginManifest[] {
  return BUILTIN_PLUGINS;
}
