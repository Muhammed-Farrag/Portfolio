import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Phase 1: every page here is a development/test reference page. None of them is a production
// route. The public site's entry (index.html) and its production build arrive in Phase 2, and
// that build must not include anything under dev/.
export default defineConfig({
  server: { port: 4311, strictPort: true, host: '127.0.0.1' },
  preview: { port: 4312, strictPort: true, host: '127.0.0.1' },
  build: {
    outDir: 'dist-reference',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        hub: resolve(__dirname, 'dev/index.html'),
        lab: resolve(__dirname, 'dev/lab/index.html'),
        lifecycle: resolve(__dirname, 'dev/lifecycle/index.html'),
      },
    },
  },
});
