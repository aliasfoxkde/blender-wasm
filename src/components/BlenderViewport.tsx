import { Component, onMount, onCleanup, createSignal, Show } from 'solid-js';
import type { CapabilityProfile } from '../core/HardwareProfiler';
import { blenderRuntime, type SmokeTestResult } from '../runtime';

type WasmAvailabilityState =
  | 'checking'
  | 'artifact-missing'
  | 'runtime-loading'
  | 'bridge-validated'
  | 'smoke-failed'
  | 'graphics-init'
  | 'ready';

interface BlenderViewportProps {
  capabilityProfile: CapabilityProfile | null;
}

export const BlenderViewport: Component<BlenderViewportProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationFrame: number;

  const [wasmState, setWasmState] = createSignal<WasmAvailabilityState>('checking');
  const [loadProgress, setLoadProgress] = createSignal(0);
  const [loadStatus, setLoadStatus] = createSignal('Initializing WASM...');
  const [isReady, setIsReady] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [smokeTest, setSmokeTest] = createSignal<SmokeTestResult | null>(null);

  const loadModules = async () => {
    setWasmState('checking');
    setLoadStatus('Checking for Blender WASM artifact...');

    try {
      setWasmState('runtime-loading');
      setLoadStatus('Loading Blender runtime...');
      setLoadProgress(30);
      await blenderRuntime.load({ canvas: canvasRef });

      setLoadProgress(80);
      setLoadStatus('Running Blender bridge smoke test...');
      setWasmState('bridge-validated');
      const smokeResult = await blenderRuntime.runSmokeTest();
      setSmokeTest(smokeResult);

      if (!smokeResult.success) {
        setWasmState('smoke-failed');
        throw new Error(
          `Blender smoke test failed: ${smokeResult.error || smokeResult.message}`
        );
      }

      setWasmState('graphics-init');
      setLoadStatus('Initializing graphics...');
      await initGraphics();

      setLoadProgress(100);
      setLoadStatus('Blender Web Edition ready');
      setWasmState('ready');
      setIsReady(true);

      startRenderLoop();
    } catch (err) {
      console.error('Failed to load Blender:', err);
      const message = err instanceof Error ? err.message : 'Failed to load Blender';

      if (message.includes('fetch') || message.includes('404') || message.includes('Not Found')) {
        setWasmState('artifact-missing');
        setError(
          'Blender WASM artifact not found. This is a minimal baseline - full Blender requires additional build steps.'
        );
      } else {
        setError(message);
      }
    }
  };

  onMount(() => {
    loadModules();
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
          await adapter.requestDevice();
          const context = canvasRef.getContext('webgpu');
          if (context) {
            console.log('Using WebGPU');
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
      configureWebGL(gl);
      return;
    }

    console.error('No graphics context available');
    setError('No graphics context available');
  };

  const configureWebGL = (gl: WebGLRenderingContext | WebGL2RenderingContext) => {
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
  };

  const startRenderLoop = () => {
    const render = () => {
      if (!isReady()) return;

      const gl = canvasRef?.getContext('webgl2') || canvasRef?.getContext('webgl');
      if (gl) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }

      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);
  };

  const getCapabilityLabel = () => {
    const gpu = props.capabilityProfile?.gpu;
    if (!gpu) return 'Unknown';
    if (gpu.webgpu) return 'WebGPU';
    if (gpu.webgl) return 'WebGL';
    return 'Limited';
  };

  return (
    <div class="viewport-container">
      <canvas
        ref={canvasRef}
        class="viewport-canvas"
        width={window.innerWidth}
        height={window.innerHeight}
      />

      {/* Loading Overlay */}
      <Show when={wasmState() !== 'ready' && !error()}>
        <div class="loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner">
              <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="var(--color-primary)" opacity="0.3"/>
                <path
                  d="M16 2L8 6v12l8 4 8-4V6l-8-4z"
                  fill="var(--color-primary)"
                />
              </svg>
            </div>

            <h2>Loading Blender WASM</h2>
            <p class="loading-status">{loadStatus()}</p>

            <Show when={wasmState() === 'bridge-validated'}>
              <p class="wasm-state-info">
                Bridge validated ✓ — running Blender smoke test
              </p>
            </Show>

            <div class="progress-container">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  style={{ width: `${loadProgress()}%` }}
                />
              </div>
              <span class="progress-text">{Math.round(loadProgress())}%</span>
            </div>

            <div class="loading-info">
              <span>Graphics: {getCapabilityLabel()}</span>
              <span>WASM State: {wasmState()}</span>
            </div>
          </div>
        </div>
      </Show>

      {/* Artifact Missing Overlay */}
      <Show when={wasmState() === 'artifact-missing'}>
        <div class="error-overlay">
          <div class="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4M12 16h.01"/>
            </svg>
            <h2>WASM Artifact Missing</h2>
            <p class="error-description">
              The Blender WASM artifact was not found. This is expected in development
              without a full Docker build. Run <code>./scripts/build-blender-wasm.sh minimal</code> to build it.
            </p>
            <p class="error-note">
              Current baseline includes: clog + guardedalloc libraries
            </p>
            <button onClick={() => window.location.reload()}>
              Retry After Build
            </button>
          </div>
        </div>
      </Show>

      {/* Error Overlay */}
      <Show when={error() && wasmState() !== 'artifact-missing'}>
        <div class="error-overlay">
          <div class="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
            <h2>WASM Load Failed</h2>
            <p>{error()}</p>
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </Show>

      {/* Status Bar */}
      <Show when={isReady()}>
        <div class="viewport-status-bar">
          <div class="status-left">
            <span class="status-indicator online" />
            <span>Blender Web Edition</span>
            <Show when={smokeTest()}>
              <span class="status-item" data-testid="blender-smoke-status">
                Bridge: {smokeTest()?.success ? 'OK' : 'FAILED'}
              </span>
            </Show>
            <span class="status-item wasm-state-badge">
              {wasmState()}
            </span>
          </div>
          <div class="status-right">
            <span class="status-item">
              {getCapabilityLabel()}
            </span>
          </div>
        </div>
      </Show>

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

        .loading-overlay,
        .error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.85);
          z-index: 10;
        }

        .loading-content,
        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          text-align: center;
          max-width: 400px;
          padding: var(--spacing-xl);
        }

        .loading-spinner {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loading-content h2,
        .error-content h2 {
          margin: 0;
          font-size: var(--font-xl);
        }

        .loading-status {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .progress-container {
          width: 100%;
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--color-bg-lighter);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: var(--font-sm);
          font-family: monospace;
          color: var(--color-text-muted);
          min-width: 40px;
        }

        .loading-info {
          display: flex;
          gap: var(--spacing-lg);
          font-size: var(--font-sm);
          color: var(--color-text-muted);
        }

        .wasm-state-info {
          color: var(--color-success);
          font-size: var(--font-sm);
          font-family: monospace;
          background: rgba(16, 185, 129, 0.1);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
        }

        .error-description {
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        .error-description code {
          background: var(--color-bg-light);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: var(--font-sm);
        }

        .error-note {
          color: var(--color-text-muted);
          font-size: var(--font-sm);
          margin: var(--spacing-sm) 0 0 0;
        }

        .error-content p {
          color: var(--color-text-secondary);
          margin: 0;
        }

        .error-content button {
          padding: var(--spacing-sm) var(--spacing-xl);
          background: var(--color-primary);
          border-radius: var(--radius-md);
          color: white;
          font-weight: 500;
          margin-top: var(--spacing-md);
        }

        .error-content button:hover {
          background: var(--color-primary-dark);
        }

        .viewport-status-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 32px;
          background: var(--color-bg-darker);
          border-top: 1px solid var(--color-bg-lighter);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-md);
          font-size: var(--font-sm);
          color: var(--color-text-secondary);
        }

        .status-left,
        .status-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.online {
          background: var(--color-success);
        }

        .status-item {
          padding: 2px var(--spacing-sm);
          background: var(--color-bg-light);
          border-radius: var(--radius-sm);
        }

        .wasm-state-badge {
          font-family: monospace;
          font-size: var(--font-xs);
          background: var(--color-bg-lighter);
        }
      `}</style>
    </div>
  );
};
