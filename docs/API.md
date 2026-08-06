# API Reference

## Overview

Blender Web Edition exposes several APIs for integration and extension.

## Public APIs

### AI Gateway

The AI Gateway provides structured APIs for scene manipulation.

```typescript
import { aiGateway } from './ai/AIGateway';

// Scene operations
const scene = await aiGateway.getSceneGraph().getScene();
await aiGateway.getSceneGraph().addObject('mesh', { name: 'Cube' });
await aiGateway.getSceneGraph().selectObject('object-id');

// Material operations
const materials = await aiGateway.getMaterials().getMaterials();

// Render operations
await aiGateway.getRender().render(false);

// Execute commands
const response = await aiGateway.execute({
  id: 'cmd-1',
  prompt: 'scene.get'
});
```

### Module Manager

```typescript
import { moduleManager } from './runtime/ModuleManager';

// Check module state
const state = moduleManager.getState();
console.log(state.loadedModules);

// Load a module
await moduleManager.load('core');

// Prefetch modules
moduleManager.prefetch(['mesh', 'animation']);

// Get suggestions
const suggestions = moduleManager.suggestModules('start_sculpting');
```

### Plugin Manager

```typescript
import { pluginManager } from './plugins/PluginManager';

// Register a plugin
await pluginManager.registerFromManifest({
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'A test plugin',
  author: 'Test',
  permissions: [
    { type: 'scene', access: 'read' }
  ],
  entrypoint: '/plugins/my-plugin/index.js'
});

// Load plugin
await pluginManager.loadPlugin('my-plugin');

// Register hooks
pluginManager.registerHook('scene.change', (data) => {
  console.log('Scene changed:', data);
});
```

### Settings Storage

```typescript
import { settingsStorage } from './storage/SettingsStorage';

// Get settings
const settings = await settingsStorage.get();
console.log(settings.graphicsQuality);

// Update settings
await settingsStorage.set({ graphicsQuality: 'ultra' });

// Listen for changes
settingsStorage.onChange(() => {
  console.log('Settings changed');
});
```

### Auth Manager

```typescript
import { authManager } from './auth/AuthManager';

// Get current state
const state = authManager.getState();
console.log(state.mode); // 'guest', 'local', or 'cloud'

// Listen for auth changes
authManager.onAuthChange((newState) => {
  console.log('Auth changed:', newState);
});

// Create profile
await authManager.createLocalProfile('My Profile');

// Sign out
await authManager.signOut();
```

### Automation API

The Automation API provides REST endpoints for integrations:

```
GET  /api/projects           - List projects
POST /api/projects           - Create project
GET  /api/projects/:id      - Get project
GET  /api/scene             - Get scene graph
POST /api/scene/objects     - Add object
POST /api/render            - Start render
GET  /api/render/progress   - Get render progress
GET  /api/system            - Get system info
```

### Performance Manager

```typescript
import { performanceManager } from './performance/PerformanceManager';

// Get current metrics
const metrics = performanceManager.getMetrics();
console.log(metrics.fps, metrics.memoryUsed);

// Auto-detect best settings
const profile = await performanceManager.autoDetect();
await performanceManager.applyProfile(profile);

// Get quality presets
const presets = performanceManager.getPresets();
console.log(presets.high);
```

## Type Definitions

All public APIs are fully typed with TypeScript. Key types:

- `AICommand`, `AIResponse`
- `CapabilityProfile`
- `ModuleInfo`, `ModuleLoadResult`
- `Plugin`, `PluginManifest`
- `UserProfile`
- `PerformanceMetrics`
- `AppSettings`
