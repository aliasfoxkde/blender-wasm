# Testing Guide

## Overview

This project uses Vitest for unit testing with happy-dom for browser API mocking.

## Test Structure

```
tests/
├── setup.ts           # Global test setup and mocks
├── unit/             # Unit tests
├── integration/      # Integration tests
└── e2e/             # End-to-end tests (future)
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

## Writing Tests

### Unit Tests

Unit tests should be placed alongside the source files:

```typescript
// src/runtime/ModuleRegistry.ts
// src/runtime/ModuleRegistry.test.ts
```

### Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModuleRegistry } from './ModuleRegistry';

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  it('should register a module', () => {
    registry.register({
      id: 'test',
      name: 'Test Module',
      version: '1.0.0',
      url: '/test.wasm',
      size: 1024,
      dependencies: [],
    });

    expect(registry.get('test')).toBeDefined();
  });
});
```

## Mocking

### Global Mocks

The `tests/setup.ts` file provides mocks for:
- `crypto.randomUUID()`
- `fetch`
- `WebAssembly`
- `navigator` properties
- `localStorage`
- `performance.now()`
- `requestAnimationFrame`

### Custom Mocks

```typescript
// Mock a specific module
vi.mock('./someModule', () => ({
  someFunction: vi.fn(),
}));
```

## Coverage

Coverage reports are generated in `coverage/` directory:

- `coverage/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI
- `coverage/test-results.json` - JSON results

### Coverage Thresholds

Minimum thresholds (enforced in CI):
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## CI Integration

Tests run automatically on push via GitHub Actions:

```yaml
- name: Run tests
  run: pnpm test:run
```

## Best Practices

1. **Test behavior, not implementation**
2. **Use `beforeEach` to reset state**
3. **Mock external dependencies**
4. **Write descriptive test names**
5. **Aim for 100% coverage on critical paths**
6. **Keep tests fast (< 100ms each)**
