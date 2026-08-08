/**
 * RealRenderPanel.tsx
 *
 * UI panel for the headless Cycles render proof.
 * Labeled explicitly as "Headless Cycles render proof" — not "Full Blender".
 *
 * Shows:
 *  - artifact / download state
 *  - render button
 *  - render elapsed time
 *  - output image (blob URL)
 *  - error details
 *
 * Does NOT show:
 *  - fake canvas, spinning cube, grid, placeholder
 *  - "Full Blender ready" or Blender editor UI
 */

import { Component, createSignal, Show, onCleanup } from 'solid-js';
import { realRenderRuntime, type RealRenderProgress, type RealRenderResult } from '../runtime';

type RenderPhase = 'idle' | 'loading' | 'rendering' | 'success' | 'error';

export const RealRenderPanel: Component = () => {
  const [phase, setPhase] = createSignal<RenderPhase>('idle');
  const [progress, setProgress] = createSignal<RealRenderProgress | null>(null);
  const [result, setResult] = createSignal<RealRenderResult | null>(null);

  let unsubscribeProgress: (() => void) | null = null;

  const handleLoad = async () => {
    setPhase('loading');
    setResult(null);

    unsubscribeProgress = realRenderRuntime.onProgress((p) => {
      setProgress(p);
      if (p.phase === 'instantiate') setPhase('loading');
      if (p.phase === 'complete') setPhase('idle');
      if (p.phase === 'error') setPhase('error');
    });

    try {
      await realRenderRuntime.load();
      setProgress({ phase: 'complete', message: 'Runtime ready' });
    } catch (err) {
      setPhase('error');
      setResult({
        success: false,
        error: err instanceof Error ? err.message : 'Load failed',
      });
    }
  };

  const handleRender = async () => {
    if (!realRenderRuntime.isLoaded()) {
      setPhase('error');
      setResult({ success: false, error: 'Runtime not loaded' });
      return;
    }

    setPhase('rendering');
    const renderResult = await realRenderRuntime.renderSampleScene();
    setResult(renderResult);
    setPhase(renderResult.success ? 'success' : 'error');
  };

  const handleDispose = () => {
    realRenderRuntime.dispose();
    unsubscribeProgress?.();
    setPhase('idle');
    setProgress(null);
    setResult(null);
  };

  onCleanup(() => {
    unsubscribeProgress?.();
  });

  return (
    <div class="real-render-panel">
      {/* Header */}
      <div class="rrp-header">
        <h2>Headless Cycles render proof</h2>
        <span class="rrp-badge">Cycles CPU</span>
      </div>

      {/* State: idle */}
      <Show when={phase() === 'idle' && !result()}>
        <div class="rrp-state">
          <p class="rrp-desc">
            Real Cycles WASM render artifact. This is <strong>not</strong> full Blender —
            it runs a headless CPU render of a sample scene.
          </p>
          <Show
            when={realRenderRuntime.isLoaded()}
            fallback={
              <button class="rrp-btn-primary" onClick={handleLoad}>
                Load render runtime
              </button>
            }
          >
            <button class="rrp-btn-primary" onClick={handleRender}>
              Run sample render
            </button>
          </Show>
        </div>
      </Show>

      {/* State: loading */}
      <Show when={phase() === 'loading'}>
        <div class="rrp-state">
          <div class="rrp-spinner" aria-label="Loading" />
          <p class="rrp-status">{progress()?.message ?? 'Loading…'}</p>
          <p class="rrp-phase">Phase: {progress()?.phase ?? '—'}</p>
        </div>
      </Show>

      {/* State: rendering */}
      <Show when={phase() === 'rendering'}>
        <div class="rrp-state">
          <div class="rrp-spinner" aria-label="Rendering" />
          <p class="rrp-status">Rendering…</p>
          <p class="rrp-phase">This may take several seconds.</p>
        </div>
      </Show>

      {/* State: success */}
      <Show when={phase() === 'success' && result()?.success}>
        <div class="rrp-state">
          <div class="rrp-success-header">
            <span class="rrp-status-dot ok" />
            <span>Render complete</span>
          </div>
          <Show when={result()?.elapsedMs}>
            <p class="rrp-time">Elapsed: {Math.round(result()!.elapsedMs!)} ms</p>
          </Show>
          <Show when={result()?.imageUrl}>
            <img
              class="rrp-output"
              src={result()!.imageUrl!}
              alt={`Rendered image ${result()!.width}×${result()!.height}`}
              width={result()!.width ?? 'auto'}
              height={result()!.height ?? 'auto'}
            />
          </Show>
          <Show when={result()?.width && result()?.height}>
            <p class="rrp-dims">{result()!.width} × {result()!.height} px</p>
          </Show>
          <div class="rrp-actions">
            <button class="rrp-btn-secondary" onClick={handleRender}>
              Re-render
            </button>
            <button class="rrp-btn-ghost" onClick={handleDispose}>
              Unload
            </button>
          </div>
        </div>
      </Show>

      {/* State: error */}
      <Show when={phase() === 'error'}>
        <div class="rrp-state">
          <div class="rrp-error-header">
            <span class="rrp-status-dot err" />
            <span>Render failed</span>
          </div>
          <p class="rrp-error-detail">{result()?.error ?? progress()?.message ?? 'Unknown error'}</p>
          <p class="rrp-note">
            Artifact may be missing or build may have failed.
            See <code>docs/minimax-real-render/</code> for build instructions.
          </p>
          <Show when={!realRenderRuntime.isLoaded()}>
            <button class="rrp-btn-primary" onClick={handleLoad}>
              Try loading again
            </button>
          </Show>
          <Show when={realRenderRuntime.isLoaded()}>
            <button class="rrp-btn-secondary" onClick={handleRender}>
              Retry render
            </button>
          </Show>
        </div>
      </Show>

      <style>{`
        .real-render-panel {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md, 16px);
          padding: var(--spacing-lg, 24px);
          max-width: 640px;
          margin: 0 auto;
        }

        .rrp-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm, 8px);
        }

        .rrp-header h2 {
          margin: 0;
          font-size: var(--font-lg, 18px);
          font-weight: 600;
        }

        .rrp-badge {
          font-size: var(--font-xs, 11px);
          font-family: monospace;
          background: rgba(255, 152, 0, 0.15);
          border: 1px solid rgba(255, 152, 0, 0.3);
          color: #ff9800;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .rrp-state {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm, 8px);
          padding: var(--spacing-lg, 24px);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
        }

        .rrp-desc {
          margin: 0;
          color: var(--color-text-secondary, #9ca3af);
          font-size: var(--font-sm, 13px);
          line-height: 1.5;
        }

        .rrp-desc strong {
          color: var(--color-text-primary, #e5e7eb);
        }

        .rrp-status {
          margin: 0;
          color: var(--color-text-primary, #e5e7eb);
          font-family: monospace;
          font-size: var(--font-sm, 13px);
        }

        .rrp-phase {
          margin: 0;
          color: var(--color-text-muted, #6b7280);
          font-size: var(--font-xs, 11px);
          font-family: monospace;
        }

        .rrp-time {
          margin: 0;
          color: var(--color-success, #10b981);
          font-family: monospace;
          font-size: var(--font-sm, 13px);
        }

        .rrp-dims {
          margin: 0;
          color: var(--color-text-muted, #6b7280);
          font-size: var(--font-xs, 11px);
          font-family: monospace;
        }

        .rrp-output {
          max-width: 100%;
          height: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .rrp-success-header,
        .rrp-error-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs, 4px);
          font-weight: 600;
          font-size: var(--font-sm, 13px);
        }

        .rrp-success-header { color: var(--color-success, #10b981); }
        .rrp-error-header { color: var(--color-error, #ef4444); }

        .rrp-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .rrp-status-dot.ok { background: var(--color-success, #10b981); }
        .rrp-status-dot.err { background: var(--color-error, #ef4444); }

        .rrp-error-detail {
          margin: 0;
          color: var(--color-error, #ef4444);
          font-size: var(--font-sm, 13px);
          font-family: monospace;
        }

        .rrp-note {
          margin: 0;
          color: var(--color-text-muted, #6b7280);
          font-size: var(--font-xs, 11px);
        }

        .rrp-note code {
          background: rgba(255,255,255,0.06);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: var(--font-xs, 11px);
        }

        .rrp-actions {
          display: flex;
          gap: var(--spacing-sm, 8px);
          margin-top: var(--spacing-xs, 4px);
        }

        .rrp-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--color-primary, #3b82f6);
          border-radius: 50%;
          animation: rrp-spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes rrp-spin {
          to { transform: rotate(360deg); }
        }

        .rrp-btn-primary {
          padding: 8px 20px;
          background: var(--color-primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: var(--font-sm, 13px);
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .rrp-btn-primary:hover { background: var(--color-primary-dark, #1d4ed8); }

        .rrp-btn-secondary {
          padding: 8px 20px;
          background: rgba(255,255,255,0.08);
          color: var(--color-text-primary, #e5e7eb);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          font-size: var(--font-sm, 13px);
          cursor: pointer;
        }
        .rrp-btn-secondary:hover { background: rgba(255,255,255,0.12); }

        .rrp-btn-ghost {
          padding: 8px 20px;
          background: transparent;
          color: var(--color-text-muted, #6b7280);
          border: none;
          font-size: var(--font-sm, 13px);
          cursor: pointer;
        }
        .rrp-btn-ghost:hover { color: var(--color-text-secondary, #9ca3af); }
      `}</style>
    </div>
  );
};
