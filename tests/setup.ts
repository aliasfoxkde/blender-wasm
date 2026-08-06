// Test setup file
import { vi } from 'vitest';

// Mock global objects
global.crypto = {
  randomUUID: () => Math.random().toString(36).substring(2) + Date.now().toString(36),
} as Crypto;

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
