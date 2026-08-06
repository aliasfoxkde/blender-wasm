# ADR 003: Frontend Framework

## Status
Accepted

## Context
We need a frontend framework for a performance-critical 3D editor running in the browser.

## Decision
Use **SolidJS** with TypeScript.

## Rationale
- **Bundle size**: SolidJS ~7KB vs React ~45KB; critical for a heavy WebGL application
- **Fine-grained reactivity**: Components render once; only specific DOM nodes update on state change
- **Real-time performance**: No virtual DOM diffing overhead; ideal for 60fps UI updates
- **TypeScript**: First-class support from project start
- **Vite compatibility**: `vite-plugin-solid` is stable and well-maintained

## Comparison
| Factor | SolidJS | React |
|--------|---------|-------|
| Bundle Size | ~7KB | ~45KB |
| Performance | Fine-grained reactivity | Virtual DOM diffing |
| Learning Curve | Steeper for React devs | Easier for React devs |
| Ecosystem | Smaller | Massive |

## State Management
- **solid-js/store** for reactive stores with fine-grained updates
- Consider Zustand if Redux DevTools bridge is needed

## Consequences
- Smaller talent pool compared to React
- Team may need to learn reactive primitives vs component lifecycle

## References
- SolidJS: https://solidjs.com
- SolidJS Tutorial: https://solidjs.com/docs/latest
