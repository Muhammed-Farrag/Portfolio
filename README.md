# Muhammed Farrag — Portfolio

Personal portfolio for Muhammed Farrag, Applied AI Engineer. The hero is built on his original Particle Portrait WebGL renderer.

The work is done in phases, and each phase needs the owner's approval. Phase 1 (stabilising the Particle Portrait) is complete. Phase 2 milestone 1 adds the React application shell: design tokens, typography, responsive navigation and the section structure. See `docs/DESIGN_SPEC.md`, `docs/SOURCE_AUDIT.md` and `docs/CONTENT_APPROVAL.md`.

## Requirements

- Node 24 (see `.nvmrc`; Node 20 or later works) and npm.
- Chromium for the browser tests: `npx playwright install chromium`.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Installs the exact dependency versions from `package-lock.json`. |
| `npm run dev` | Starts Vite on http://127.0.0.1:4311 and opens the site. Development reference pages are at `/dev/`. |
| `npm run build` | Production build of the public site into `dist/` (index.html only; never includes `dev/` or `legacy/`). |
| `npm run preview` | Serves `dist/` on http://127.0.0.1:4312. |
| `npm run serve:legacy` | Serves the untouched original prototype at http://127.0.0.1:4310/legacy/particle-portrait/. |
| `npm run typecheck` | TypeScript, strict mode. |
| `npm run lint` | ESLint. |
| `npm test` | Unit tests (Vitest): sampling parity, shader provenance, legacy file integrity, recognition manifest rules. |
| `npm run build:reference` | Builds the development reference pages into `dist-reference/`. This is not a production build. |
| `npm run build:preview` | Builds the portable single-file Portrait Lab: `dist-preview/particle-portrait-preview.html`. |
| `npm run test:e2e` | Builds the site and the preview, then runs the Playwright suite. It starts all three servers itself. |
| `npm run check` | All of the above, in order. |

## Layout

```
legacy/particle-portrait/      Byte-identical copy of D:\particle-portrait (never edited; hashes enforced by a test)
index.html, src/main.tsx      Public site entry (React 18)
src/app/                       App composition
src/components/                Layout (header, section frame, footer) and <Pending>
src/sections/                  Hero and Contact; the other scenes use the shared Section frame for now
src/content/site.ts            Shell copy and section structure (approved claims only)
src/styles/                    tokens.css (Dark Botanical tokens) and global.css
src/features/particle-portrait/
  shaders.ts                   Legacy GLSL verbatim, plus a colour-only botanical tone branch
  sampling.ts                  Point sampling, byte-identical to the legacy loop
  ParticleRenderer.ts          The engine: legacy draw/tick/scatter, plus lifecycle (dispose, observers, context restore)
dev/                           Development and test pages only. Never production routes; noindex.
  lab/                         The original Portrait Lab interface running on the maintained engine
  lifecycle/                   Harness for the create/dispose tests
content-source/recognition/    Owner-supplied event photos and manifest.json (see its README)
tests/unit/                    Vitest
tests/e2e/                     Playwright
docs/                          Design specification, source audit, content approval register
```

## Particle Portrait engine

```ts
import { createParticleRenderer, BOTANICAL_BACKGROUND } from './src/features/particle-portrait';

const result = createParticleRenderer(canvas, image, {
  pointerTarget: stage,        // element whose pointer movement displaces particles
  sizeTarget: stage,           // element whose box sizes the canvas (ResizeObserver)
  paused: matchMedia('(prefers-reduced-motion: reduce)').matches,
  settings: { tone: 'botanical', background: BOTANICAL_BACKGROUND },
});
if ('fallback' in result) showStaticImage(result.fallback); // 'no-webgl' | 'shader-error' | 'tainted-image'
else {
  result.on('state', (s) => /* responding | scattering | reforming | paused | inactive | context-lost | failed */ {});
  result.set({ step: 3 });     // re-samples only when step or threshold change
  result.scatter();
  result.dispose();            // removes every listener and observer and stops the loop
}
```

Sampling, physics, pointer mapping and scatter/reform are unchanged from the prototype. The engine stops rendering when the canvas is off-screen or the tab is hidden, emits state only on change, and rebuilds itself after a lost WebGL context. `dispose()` leaves the WebGL context alive so that a renderer re-created on the same canvas works.

## Placeholders

`<Pending>` marks unfinished work. It renders only in development (`npm run dev`) or when `VITE_SHOW_PENDING=true`, and renders nothing in a production build. A test checks the production build for placeholders.

## Tests

The Playwright suite runs the same behaviour tests against the **original prototype** (`legacy-*` projects) and the **maintained engine** (`lab-*` projects), at 1440×900 and 390×844. Tests that document a defect in the original are marked as expected failures for the legacy projects only. WebGL runs on SwiftShader, so no GPU is needed. Tracing is off because DOM snapshots on every action starve a page that redraws WebGL at 60 fps.

The `site-*` projects cover the public site: structure, fonts, skip link, navigation (desktop and the mobile menu), overflow at 390/768/1280/1440 px, axe accessibility scan, reduced motion, and the production build. `tests/unit/tokens.test.ts` checks every allowed colour pair against WCAG.

Baseline point counts (Chromium, original prototype): 10,203 / 4,525 / 2,549 at Ultra / Fine / Soft.

## Git

Commits are local only. No remote is configured, and nothing is pushed until the owner confirms the destination.
