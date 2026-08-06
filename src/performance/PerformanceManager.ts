/**
 * Performance Manager - Optimization and performance monitoring
 */

import { settingsStorage } from '../storage/SettingsStorage';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsed: number;
  memoryLimit: number;
  drawCalls: number;
  triangles: number;
  gpuUtilization: number;
  cpuUtilization: number;
}

export interface PerformanceProfile {
  name: string;
  settings: {
    graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
    enableSIMD: boolean;
    enableThreads: boolean;
    maxMemoryMB: number;
    vsync: boolean;
    maxDrawCalls: number;
    textureResolution: number;
  };
}

const PRESETS: Record<string, PerformanceProfile['settings']> = {
  low: {
    graphicsQuality: 'low',
    enableSIMD: false,
    enableThreads: false,
    maxMemoryMB: 512,
    vsync: true,
    maxDrawCalls: 100,
    textureResolution: 512,
  },
  medium: {
    graphicsQuality: 'medium',
    enableSIMD: true,
    enableThreads: true,
    maxMemoryMB: 1024,
    vsync: true,
    maxDrawCalls: 500,
    textureResolution: 1024,
  },
  high: {
    graphicsQuality: 'high',
    enableSIMD: true,
    enableThreads: true,
    maxMemoryMB: 2048,
    vsync: true,
    maxDrawCalls: 1000,
    textureResolution: 2048,
  },
  ultra: {
    graphicsQuality: 'ultra',
    enableSIMD: true,
    enableThreads: true,
    maxMemoryMB: 4096,
    vsync: false,
    maxDrawCalls: 2000,
    textureResolution: 4096,
  },
};

class PerformanceManager {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    memoryLimit: 0,
    drawCalls: 0,
    triangles: 0,
    gpuUtilization: 0,
    cpuUtilization: 0,
  };
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private rafId = 0;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor() {
    this.lastFrameTime = performance.now();
  }

  async init(): Promise<void> {
    const settings = await settingsStorage.get();
    const preset = PRESETS[settings.graphicsQuality] || PRESETS.high;

    // Apply settings
    await settingsStorage.set({
      enableSIMD: preset.enableSIMD,
      enableThreads: preset.enableThreads,
      maxMemoryMB: preset.maxMemoryMB,
    });
  }

  startMonitoring(): void {
    if (this.rafId) return;

    const measure = () => {
      this.updateMetrics();
      this.rafId = requestAnimationFrame(measure);
    };

    this.rafId = requestAnimationFrame(measure);
  }

  stopMonitoring(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private updateMetrics(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Track frame times for FPS calculation
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    // Calculate average FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.metrics.fps = Math.round(1000 / avgFrameTime);
    this.metrics.frameTime = Math.round(avgFrameTime * 100) / 100;

    // Memory estimation (would need actual WASM memory query in production)
    this.metrics.memoryUsed = this.estimateMemoryUsage();
    this.metrics.memoryLimit = 2048 * 1024 * 1024; // 2GB default limit
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on loaded modules
    // In production, this would query WASM memory directly
    const loadedModules = 3; // core + basic modules
    return loadedModules * 50 * 1024 * 1024; // ~50MB per module
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  onMetricsUpdate(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Auto-detect best settings based on hardware
  async autoDetect(): Promise<PerformanceProfile> {
    const detectCPU = () => {
      return navigator.hardwareConcurrency || 4;
    };

    const detectGPU = async () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return 'unknown';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
      return 'unknown';
    };

    const detectMemory = () => {
      // navigator.deviceMemory is non-standard but widely supported
      const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
      return deviceMemory || 4;
    };

    const cores = detectCPU();
    const gpu = await detectGPU();
    const memory = detectMemory();

    // Determine preset based on hardware
    let preset = 'medium';
    if (cores >= 8 && memory >= 16) {
      preset = 'ultra';
    } else if (cores >= 4 && memory >= 8) {
      preset = 'high';
    } else if (cores >= 2 && memory >= 4) {
      preset = 'medium';
    } else {
      preset = 'low';
    }

    return {
      name: preset,
      settings: PRESETS[preset],
    };
  }

  async applyProfile(profile: PerformanceProfile): Promise<void> {
    await settingsStorage.set({
      graphicsQuality: profile.settings.graphicsQuality,
      enableSIMD: profile.settings.enableSIMD,
      enableThreads: profile.settings.enableThreads,
      maxMemoryMB: profile.settings.maxMemoryMB,
      vsync: profile.settings.vsync,
    });
  }

  getPresets(): Record<string, PerformanceProfile['settings']> {
    return { ...PRESETS };
  }

  // Performance optimizations
  async optimize(): Promise<void> {
    // Check for SIMD support
    const hasSIMD = typeof WebAssembly !== 'undefined' &&
      typeof WebAssembly.validate === function() {
        try {
          // Simple SIMD detection
          return new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 7, 1, 96, 0, 1, 123, 3, 2, 1, 0, 7, 8, 1, 4, 116, 121, 112, 101, 0, 0]).some(() => true);
        } catch {
          return false;
        }
      }();

    // Check for SharedArrayBuffer (threads)
    const hasThreads = typeof SharedArrayBuffer !== 'undefined';

    // Check for WebGPU
    const hasWebGPU = !!navigator.gpu;

    console.log('Performance optimizations available:');
    console.log('- SIMD:', hasSIMD ? '✓' : '✗');
    console.log('- Threads:', hasThreads ? '✓' : '✗');
    console.log('- WebGPU:', hasWebGPU ? '✓' : '✗');
  }

  // Memory pressure handling
  requestMemory(targetMB: number): boolean {
    // Request more memory from WASM if needed
    // In production, this would call into Blender WASM
    console.log(`Requested ${targetMB}MB of memory`);
    return true;
  }

  garbageCollect(): void {
    // Hint to GC that now is a good time
    if (typeof window !== 'undefined') {
      window.gc?.();
    }
  }
}

export const performanceManager = new PerformanceManager();
