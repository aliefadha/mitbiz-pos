import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [swc.vite()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '..', 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['**/*.e2e-spec.ts'],
    testTimeout: 30000,
  },
});
