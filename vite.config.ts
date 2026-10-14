import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `vite build` produces the public site from index.html only. The development reference pages
// under dev/ (Portrait Lab, lifecycle harness) are built separately with `--mode reference` and
// must never be part of the production output.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 4311, strictPort: true, host: '127.0.0.1' },
  preview: { port: 4312, strictPort: true, host: '127.0.0.1' },
  build:
    mode === 'reference'
      ? {
          outDir: 'dist-reference',
          emptyOutDir: true,
          rollupOptions: {
            input: {
              hub: resolve(__dirname, 'dev/index.html'),
              lab: resolve(__dirname, 'dev/lab/index.html'),
              lifecycle: resolve(__dirname, 'dev/lifecycle/index.html'),
            },
          },
        }
      : {
          outDir: 'dist',
          emptyOutDir: true,
          rollupOptions: { input: resolve(__dirname, 'index.html') },
        },
}));
