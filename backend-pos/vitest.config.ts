import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'better-auth': resolve(__dirname, 'test/mocks/empty.js'),
      'better-call': resolve(__dirname, 'test/mocks/empty.js'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 30000,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.e2e-spec.ts'],
      reporter: ['text', 'lcov'],
    },
  },
});
