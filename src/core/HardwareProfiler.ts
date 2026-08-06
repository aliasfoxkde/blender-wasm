export interface CapabilityProfile {
  cpu: {
    cores: number;
    threads: number;
    model: string;
  };
  gpu: {
    vendor: string;
    model: string;
    renderer: string;
    webgpu: boolean;
    webgl: boolean;
    maxTextureSize: number;
  };
  memory: {
    ramGB: number;
    webglMemoryMB: number;
  };
  features: {
    simd: boolean;
    threads: boolean;
    memory64: boolean;
    wasm: boolean;
  };
  browser: {
    name: string;
    version: string;
    platform: string;
  };
  storage: {
    quotaMB: number;
    availableMB: number;
  };
  network: {
    online: boolean;
    effectiveType: string;
  };
}

export class HardwareProfiler {
  async profile(): Promise<CapabilityProfile> {
    const [
      cpu,
      gpu,
      memory,
      features,
      browser,
      storage,
      network
    ] = await Promise.all([
      this.detectCPU(),
      this.detectGPU(),
      this.detectMemory(),
      this.detectFeatures(),
      this.detectBrowser(),
      this.detectStorage(),
      this.detectNetwork()
    ]);

    return {
      cpu,
      gpu,
      memory,
      features,
      browser,
      storage,
      network
    };
  }

  private async detectCPU(): Promise<CapabilityProfile['cpu']> {
    const cores = navigator.hardwareConcurrency || 4;
    const threads = cores; // web workers can use all cores

    // Try to get more CPU info
    let model = 'Unknown';
    try {
      const ua = navigator.userAgent;
      if (ua.includes('Apple Silicon')) model = 'Apple Silicon';
      else if (ua.includes('Intel')) model = 'Intel';
      else if (ua.includes('AMD')) model = 'AMD';
      else if (ua.includes('Snapdragon')) model = 'Snapdragon';
    } catch {
      // Ignore
    }

    return { cores, threads, model };
  }

  private async detectGPU(): Promise<CapabilityProfile['gpu']> {
    const canvas = document.createElement('canvas');
    let webgpu = false;
    let webgl = false;
    let renderer = 'Unknown';
    let vendor = 'Unknown';
    let maxTextureSize = 4096;

    // Check WebGPU
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          webgpu = true;
          const info = adapter.info;
          vendor = info.vendor;
          renderer = info.architecture || info.device;
        }
      } catch {
        // WebGPU not available
      }
    }

    // Check WebGL
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      webgl = true;
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
      }
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    }

    return { vendor, model: renderer, renderer, webgpu, webgl, maxTextureSize };
  }

  private async detectMemory(): Promise<CapabilityProfile['memory']> {
    // @ts-ignore - deviceMemory is not in TypeScript lib
    const ramGB = navigator.deviceMemory || 4;
    const webglMemoryMB = 512; // Conservative estimate

    return { ramGB, webglMemoryMB };
  }

  private async detectFeatures(): Promise<CapabilityProfile['features']> {
    const simd = typeof WebAssembly !== 'undefined' &&
      typeof WebAssembly.validate === 'function';
    const threads = typeof SharedArrayBuffer !== 'undefined';
    const memory64 = typeof WebAssembly !== 'undefined';

    // Check WASM support
    let wasm = false;
    try {
      wasm = WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
    } catch {
      wasm = false;
    }

    return { simd, threads, memory64, wasm };
  }

  private async detectBrowser(): Promise<CapabilityProfile['browser']> {
    const ua = navigator.userAgent;
    let name = 'Unknown';
    let version = '0';

    if (ua.includes('Chrome')) {
      name = 'Chrome';
      version = ua.match(/Chrome\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('Firefox')) {
      name = 'Firefox';
      version = ua.match(/Firefox\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      version = ua.match(/Version\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('Edge')) {
      name = 'Edge';
      version = ua.match(/Edge\/(\d+)/)?.[1] || '0';
    }

    return {
      name,
      version,
      platform: navigator.platform
    };
  }

  private async detectStorage(): Promise<CapabilityProfile['storage']> {
    let quotaMB = 0;
    let availableMB = 0;

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
        availableMB = Math.round((estimate.usage || 0) / (1024 * 1024));
      } catch {
        // Storage estimate failed
      }
    }

    return { quotaMB, availableMB };
  }

  private async detectNetwork(): Promise<CapabilityProfile['network']> {
    const online = navigator.onLine;
    // @ts-ignore - effectiveType is not always typed
    const effectiveType = navigator.connection?.effectiveType || 'unknown';

    return { online, effectiveType };
  }
}
