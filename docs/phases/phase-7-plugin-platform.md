# Phase 7: Plugin Platform

**Status**: Completed

## Objectives

- [x] Web-native extension system
- [x] Plugin manifest format
- [x] Permission model
- [x] Plugin loading/unloading
- [x] Hook system for events
- [x] Built-in plugin registry
- [x] Plugin dialog UI

## Plugin Architecture

### Plugin Manifest
```json
{
  "id": "plugin-id",
  "name": "Plugin Name",
  "version": "1.0.0",
  "description": "What it does",
  "author": "Author Name",
  "permissions": [
    { "type": "filesystem", "access": "read" },
    { "type": "scene", "access": "write" }
  ],
  "assets": ["/wasm/plugin.wasm"],
  "entrypoint": "/plugins/id/index.js"
}
```

### Permission Types
| Type | Access | Description |
|------|--------|-------------|
| filesystem | read/write | Read/write files |
| network | read | Network requests |
| scene | read/write | Scene graph access |
| ui | execute | UI extensions |
| ai | execute | AI command handling |

### Hooks
| Hook | Trigger |
|------|---------|
| onInit | Plugin initialized |
| onLoad | Plugin loaded |
| onUnload | Plugin unloaded |
| onSceneChange | Scene modified |
| onAICommand | AI command received |

## Built-in Plugins

| Plugin | Description |
|--------|-------------|
| io-obj | OBJ import/export |
| io-fbx | FBX import/export |
| io-usd | USD import/export |
| ai-assist | AI assistant |
| asset-browser | Asset library browser |
| render-cycles | Cycles renderer |

## Files Created

```
src/plugins/
├── PluginManager.ts     # Plugin system core
├── PluginRegistry.ts   # Built-in plugins
├── PluginDialog.tsx    # Plugin management UI
└── index.ts
```

## Next Steps

Proceed to Phase 8: AI Platform
