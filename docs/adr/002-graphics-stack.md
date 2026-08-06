# ADR 002: Graphics Stack

## Status
Accepted

## Context
We need to render 3D content in the browser with good performance across devices.

## Decision
Use **WebGPU as primary** with **WebGL fallback**.

## Rationale
- WebGPU provides 2-3x performance improvement in compute-intensive tasks
- ~83% global adoption (Chrome, Edge, Safari, Opera, Samsung Internet)
- Libraries like Three.js and Babylon.js handle WebGPU/WebGL fallback automatically
- WebGL provides universal fallback for Firefox (~16% of users)

## Browser Compatibility Matrix
| Browser | Support |
|---------|---------|
| Chrome 113+ | Full |
| Edge 113+ | Full |
| Safari 26+ | Partial |
| Firefox | None (WebGL fallback) |
| Opera 99+ | Full |
| Samsung Internet 24+ | Full |

## Consequences
- Must test on Safari for partial feature compatibility
- Firefox users get WebGL experience
- Use progressive enhancement: detect WebGPU, enhance rather than degrade

## References
- CanIUse WebGPU: https://caniuse.com/webgpu
- Three.js WebGPURenderer: https://threejs.org/examples/#webgpu
