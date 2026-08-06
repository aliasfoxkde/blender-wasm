// Test setup file
import { vi } from 'vitest';

// Mock global objects using Object.defineProperty for read-only globals
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    }),
    subtle: {
      digest: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
      deriveBits: vi.fn(),
      deriveKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
      wrapKey: vi.fn(),
      unwrapKey: vi.fn(),
    },
  },
  writable: true,
  configurable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock WebAssembly
global.WebAssembly = {
  ...global.WebAssembly,
  validate: vi.fn(() => true),
  compile: vi.fn(),
  instantiate: vi.fn(),
  Memory: vi.fn(),
  Table: vi.fn(),
} as unknown as typeof WebAssembly;

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    hardwareConcurrency: 4,
    deviceMemory: 8,
    onLine: true,
    userAgent: 'test-agent',
    platform: 'test-platform',
    gpu: null,
    storage: {
      estimate: vi.fn().mockResolvedValue({ quota: 1000000000, usage: 0 }),
    },
    serviceWorker: {
      register: vi.fn(),
    },
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock performance
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  },
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
  return 0;
});
global.cancelAnimationFrame = vi.fn();

// Silence console.error during tests unless explicitly needed
const originalConsoleError = console.error;
console.error = vi.fn((...args: unknown[]) => {
  // Allow certain errors to pass through
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleError(...args);
});
