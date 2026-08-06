import { Component, onMount, onCleanup } from 'solid-js';
import type { CapabilityProfile } from '../core/HardwareProfiler';

interface BlenderViewportProps {
  capabilityProfile: CapabilityProfile | null;
}

export const BlenderViewport: Component<BlenderViewportProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationFrame: number;

  onMount(() => {
    if (canvasRef) {
      // Initialize WebGL/WebGPU context
      initGraphics();

      // Start render loop
      const render = () => {
        // TODO: Call into Blender WASM
        animationFrame = requestAnimationFrame(render);
      };
      animationFrame = requestAnimationFrame(render);
    }
  });

  onCleanup(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  const initGraphics = async () => {
    if (!canvasRef) return;

    const profile = props.capabilityProfile;
    const gpu = profile?.gpu;

    // Try WebGPU first, fall back to WebGL
    if (gpu?.webgpu && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          const device = await adapter.requestDevice();
          const context = canvasRef.getContext('webgpu');
          if (context) {
            console.log('Using WebGPU');
            // WebGPU context initialized
            return;
          }
        }
      } catch (e) {
        console.warn('WebGPU initialization failed, falling back to WebGL:', e);
      }
    }

    // Fall back to WebGL
    const gl = canvasRef.getContext('webgl2') || canvasRef.getContext('webgl');
    if (gl) {
      console.log('Using WebGL');
      // WebGL context initialized
      return;
    }

    console.error('No graphics context available');
  };

  return (
    <div class="viewport-container">
      <canvas
        ref={canvasRef}
        class="viewport-canvas"
        width={window.innerWidth}
        height={window.innerHeight}
      />

      <div class="viewport-overlay">
        <div class="viewport-status">
          <span class="status-indicator"></span>
          <span>Blender WASM - Ready</span>
        </div>
      </div>

      <div class="viewport-placeholder">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <h2>Blender Viewport</h2>
        <p>Blender WASM integration coming soon...</p>
        <p class="hint">
          {props.capabilityProfile?.gpu.webgpu
            ? 'Your system supports WebGPU for optimal performance'
            : props.capabilityProfile?.gpu.webgl
            ? 'Using WebGL fallback'
            : 'Limited graphics capabilities detected'}
        </p>
      </div>

      <style>{`
        .viewport-container {
          flex: 1;
          position: relative;
          background: var(--color-bg-darker);
          overflow: hidden;
        }

        .viewport-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .viewport-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: var(--spacing-md);
          pointer-events: none;
        }

        .viewport-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: rgba(0, 0, 0, 0.6);
          border-radius: var(--radius-full);
          font-size: var(--font-sm);
          color: var(--color-text-secondary);
          width: fit-content;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-success);
        }

        .viewport-placeholder {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          text-align: center;
          color: var(--color-text-muted);
        }

        .viewport-placeholder h2 {
          font-size: var(--font-xl);
          color: var(--color-text-secondary);
          margin: 0;
        }

        .viewport-placeholder p {
          margin: 0;
        }

        .viewport-placeholder .hint {
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
};
