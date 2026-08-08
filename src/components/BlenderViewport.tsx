import { Component, onMount, onCleanup, createSignal, For, Show } from 'solid-js';
import type { CapabilityProfile } from '../core/HardwareProfiler';
import {
  blenderRuntime,
  blenlibRuntime,
  type BlenlibCapabilities,
  type SmokeTestResult,
} from '../runtime';

type WasmAvailabilityState =
  | 'checking'
  | 'artifact-missing'
  | 'runtime-loading'
  | 'bridge-validated'
  | 'blenlib-loading'
  | 'blenlib-validated'
  | 'smoke-failed'
  | 'graphics-init'
  | 'ready';

interface BlenderViewportProps {
  capabilityProfile: CapabilityProfile | null;
}

type ViewportGL = WebGLRenderingContext | WebGL2RenderingContext;

interface PreviewScene {
  gl: ViewportGL;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  positionLocation: number;
  colorLocation: number;
  stride: number;
}

export const BlenderViewport: Component<BlenderViewportProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let animationFrame: number;
  let previewScene: PreviewScene | null = null;

  const [wasmState, setWasmState] = createSignal<WasmAvailabilityState>('checking');
  const [loadProgress, setLoadProgress] = createSignal(0);
  const [loadStatus, setLoadStatus] = createSignal('Initializing WASM...');
  const [isReady, setIsReady] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [smokeTest, setSmokeTest] = createSignal<SmokeTestResult | null>(null);
  const [blenlibCapabilities, setBlenlibCapabilities] = createSignal<BlenlibCapabilities | null>(null);
  const [blenlibHash, setBlenlibHash] = createSignal<number | null>(null);
  const [blenlibSmokeOk, setBlenlibSmokeOk] = createSignal(false);

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

      setLoadProgress(88);
      setLoadStatus('Loading Blender blenlib module...');
      setWasmState('blenlib-loading');
      await blenlibRuntime.load();
      const blenlibSmoke = await blenlibRuntime.runSmokeTest();
      const capabilities = await blenlibRuntime.getCapabilities();
      const hash = await blenlibRuntime.hashStringMm2a('Blender');

      if (!blenlibSmoke || !capabilities) {
        setWasmState('smoke-failed');
        throw new Error('Blender blenlib module loaded but failed its smoke test');
      }

      setBlenlibSmokeOk(blenlibSmoke);
      setBlenlibCapabilities(capabilities);
      setBlenlibHash(hash);
      setWasmState('blenlib-validated');

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
    if (previewScene) {
      previewScene.gl.deleteBuffer(previewScene.buffer);
      previewScene.gl.deleteProgram(previewScene.program);
      previewScene = null;
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
    const glOptions: WebGLContextAttributes = {
      antialias: true,
      preserveDrawingBuffer: true,
    };
    const gl = canvasRef.getContext('webgl2', glOptions) || canvasRef.getContext('webgl', glOptions);
    if (gl) {
      console.log('Using WebGL');
      configureWebGL(gl);
      return;
    }

    console.error('No graphics context available');
    setError('No graphics context available');
  };

  const configureWebGL = (gl: WebGLRenderingContext | WebGL2RenderingContext) => {
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0.055, 0.06, 0.07, 1.0);
    previewScene = createPreviewScene(gl);
  };

  const createShader = (gl: ViewportGL, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error('Unable to create WebGL shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'unknown shader error';
      gl.deleteShader(shader);
      throw new Error(`WebGL shader compile failed: ${info}`);
    }

    return shader;
  };

  const createPreviewScene = (gl: ViewportGL): PreviewScene => {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec3 a_color;
      varying vec3 v_color;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec3 v_color;

      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `);
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Unable to create WebGL program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || 'unknown link error';
      gl.deleteProgram(program);
      throw new Error(`WebGL program link failed: ${info}`);
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      throw new Error('Unable to create WebGL buffer');
    }

    return {
      gl,
      program,
      buffer,
      positionLocation: gl.getAttribLocation(program, 'a_position'),
      colorLocation: gl.getAttribLocation(program, 'a_color'),
      stride: 5 * Float32Array.BYTES_PER_ELEMENT,
    };
  };

  const resizeCanvasToDisplaySize = () => {
    if (!canvasRef) return;

    const width = Math.max(1, Math.floor(canvasRef.clientWidth * window.devicePixelRatio));
    const height = Math.max(1, Math.floor(canvasRef.clientHeight * window.devicePixelRatio));
    if (canvasRef.width !== width || canvasRef.height !== height) {
      canvasRef.width = width;
      canvasRef.height = height;
    }
  };

  const buildPreviewVertices = () => {
    const vertices: number[] = [];
    const addLine = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      color: [number, number, number]
    ) => {
      vertices.push(ax, ay, color[0], color[1], color[2], bx, by, color[0], color[1], color[2]);
    };

    const gridColor: [number, number, number] = [0.19, 0.22, 0.26];
    const axisX: [number, number, number] = [0.86, 0.22, 0.24];
    const axisY: [number, number, number] = [0.28, 0.68, 0.34];
    for (let i = -10; i <= 10; i += 1) {
      const p = i / 10;
      addLine(-0.92, p * 0.72, 0.92, p * 0.72, i === 0 ? axisX : gridColor);
      addLine(p * 0.92, -0.72, p * 0.92, 0.72, i === 0 ? axisY : gridColor);
    }

    return new Float32Array(vertices);
  };

  const renderPreviewScene = () => {
    if (!previewScene || !canvasRef) return;

    const { gl, program, buffer, positionLocation, colorLocation, stride } = previewScene;
    resizeCanvasToDisplaySize();
    gl.viewport(0, 0, canvasRef.width, canvasRef.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const vertices = buildPreviewVertices();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(
      colorLocation,
      3,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT
    );
    gl.drawArrays(gl.LINES, 0, vertices.length / 5);
  };

  const startRenderLoop = () => {
    const render = () => {
      if (!isReady()) return;

      if (previewScene) {
        renderPreviewScene();
      } else {
        const gl = canvasRef?.getContext('webgl2') || canvasRef?.getContext('webgl');
        if (gl) {
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
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

            <Show when={wasmState() === 'blenlib-loading' || wasmState() === 'blenlib-validated'}>
              <p class="wasm-state-info">
                blenlib module {wasmState() === 'blenlib-validated' ? 'validated' : 'loading'}
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
        <div class="runtime-diagnostics" data-testid="blender-runtime-diagnostics">
          <div class="diagnostics-header">
            <span class="status-indicator online" />
            <span>Real Blender WASM modules loaded</span>
          </div>
          <div class="diagnostics-grid">
            <div>
              <span class="diagnostic-label">Core bridge</span>
              <strong>{smokeTest()?.success ? 'OK' : 'FAILED'}</strong>
            </div>
            <div>
              <span class="diagnostic-label">blenlib smoke</span>
              <strong data-testid="blenlib-smoke-status">{blenlibSmokeOk() ? 'OK' : 'FAILED'}</strong>
            </div>
            <div>
              <span class="diagnostic-label">hash("Blender")</span>
              <strong data-testid="blenlib-hash">{blenlibHash()}</strong>
            </div>
            <div>
              <span class="diagnostic-label">runtime scope</span>
              <strong>{blenlibCapabilities()?.build_type || 'minimal'}</strong>
            </div>
          </div>
          <div class="diagnostics-libraries">
            <For each={blenlibCapabilities()?.libraries || []}>
              {(library) => (
                <span>
                  {library.name}: {library.provides.join(', ')}
                </span>
              )}
            </For>
          </div>
          <p>
            Native Blender scene rendering is not in this build yet. This
            page is running the current compiled Blender baseline in WASM:
            core bridge, guarded allocator, DNA, and blenlib.
          </p>
        </div>
        <div class="viewport-status-bar">
          <div class="status-left">
            <span class="status-indicator online" />
            <span>Blender Web Edition</span>
            <Show when={smokeTest()}>
              <span class="status-item" data-testid="blender-smoke-status">
                Bridge: {smokeTest()?.success ? 'OK' : 'FAILED'}
              </span>
            </Show>
            <span class="status-item" data-testid="blender-blenlib-status">
              blenlib: {blenlibSmokeOk() ? 'OK' : 'FAILED'}
            </span>
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

        .runtime-diagnostics {
          position: absolute;
          top: 72px;
          left: 50%;
          transform: translateX(-50%);
          width: min(760px, calc(100% - 48px));
          background: rgba(22, 24, 27, 0.92);
          border: 1px solid var(--color-bg-lighter);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          z-index: 2;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
        }

        .diagnostics-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 700;
          margin-bottom: var(--spacing-md);
        }

        .diagnostics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }

        .diagnostics-grid > div {
          min-width: 0;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-sm);
          padding: var(--spacing-sm);
        }

        .diagnostic-label {
          display: block;
          color: var(--color-text-muted);
          font-size: var(--font-xs);
          margin-bottom: var(--spacing-xs);
        }

        .diagnostics-grid strong {
          display: block;
          overflow-wrap: anywhere;
          font-family: monospace;
          color: var(--color-text-primary);
        }

        .diagnostics-libraries {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-md);
        }

        .diagnostics-libraries span {
          background: rgba(255, 152, 0, 0.12);
          border: 1px solid rgba(255, 152, 0, 0.22);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-xs);
          padding: 4px 8px;
        }

        .runtime-diagnostics p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: var(--font-sm);
          line-height: 1.5;
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

        @media (max-width: 760px) {
          .runtime-diagnostics {
            top: 64px;
            width: calc(100% - 24px);
            padding: var(--spacing-md);
          }

          .diagnostics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
};
