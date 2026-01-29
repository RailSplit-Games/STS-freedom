import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'ES2022',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
