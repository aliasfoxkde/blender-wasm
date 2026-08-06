import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: 'coverage',
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts',
        'src/index.tsx',
        'src/App.tsx'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    },
    setupFiles: ['./tests/setup.ts'],
    reporters: ['default', 'verbose'],
    outputFile: {
      json: './coverage/test-results.json'
    }
  }
});
