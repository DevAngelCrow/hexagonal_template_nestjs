import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/modules\/auth\/(.*)/, replacement: `${path.resolve(__dirname, './src/modules/iam/auth')}/$1` },
      { find: /^@\/modules\/identity-access-management\/(.*)/, replacement: `${path.resolve(__dirname, './src/modules/iam/identity-access-management')}/$1` },
      { find: /^@\/modules\/profile\/(.*)/, replacement: `${path.resolve(__dirname, './src/modules/iam/profile')}/$1` },
      { find: /^@\/modules\/security\/(.*)/, replacement: `${path.resolve(__dirname, './src/modules/iam/security')}/$1` },
      { find: '@/modules/auth', replacement: path.resolve(__dirname, './src/modules/iam/auth') },
      { find: '@/modules/identity-access-management', replacement: path.resolve(__dirname, './src/modules/iam/identity-access-management') },
      { find: '@/modules/profile', replacement: path.resolve(__dirname, './src/modules/iam/profile') },
      { find: '@/modules/security', replacement: path.resolve(__dirname, './src/modules/iam/security') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'src', replacement: path.resolve(__dirname, './src') },
      { find: 'generated', replacement: path.resolve(__dirname, './generated') },
    ],
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
