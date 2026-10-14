import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // legacy/ is the byte-identical reference prototype and is never linted or edited.
    ignores: ['legacy/**', 'content-source/**', 'node_modules/**', 'dist*/**', 'test-results/**', 'playwright-report/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
