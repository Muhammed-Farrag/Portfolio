import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Builds the portable single-file Portrait Lab (the successor of the hand-maintained
// particle-portrait-preview.html). Every script, stylesheet and image is inlined, so the file
// renders WebGL when opened straight from disk. Reference artifact only; never deployed.
function inlineIntoHtml(): Plugin {
  return {
    name: 'inline-into-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'));
      if (!html || html.type !== 'asset') throw new Error('preview build produced no HTML');
      let source = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk') {
          const code = file.code.replace(/<\/script/gi, '<\\/script');
          const tag = new RegExp(`<script type="module"[^>]*src="[^"]*${escape(name)}"[^>]*></script>`);
          if (!tag.test(source)) throw new Error(`script tag for ${name} not found`);
          source = source.replace(tag, () => `<script type="module">${code}</script>`);
          delete bundle[name];
        } else if (name.endsWith('.css')) {
          const tag = new RegExp(`<link rel="stylesheet"[^>]*href="[^"]*${escape(name)}"[^>]*>`);
          if (!tag.test(source)) throw new Error(`stylesheet tag for ${name} not found`);
          source = source.replace(tag, () => `<style>${String(file.type === 'asset' ? file.source : '')}</style>`);
          delete bundle[name];
        }
      }
      delete bundle[html.fileName];
      this.emitFile({ type: 'asset', fileName: 'particle-portrait-preview.html', source });
    },
  };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default defineConfig({
  base: './',
  plugins: [inlineIntoHtml()],
  build: {
    outDir: 'dist-preview',
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { input: resolve(__dirname, 'dev/lab/index.html') },
  },
});
