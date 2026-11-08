import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'generated', replacement: path.resolve(__dirname, './generated') },
    ],
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    setupFiles: ['./src/shared/infrastructure/state-machine/xstate-engine.adapter.ts'],
  },
});
