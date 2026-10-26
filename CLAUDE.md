# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal portfolio of Muhammed Farrag (Applied AI Engineer): Vite 5 + React 18 + TypeScript (strict),
no UI framework, plain CSS. One page of sections; the hero is a still photograph with the name split
around him, and every later section sits over a canvas star field. Current work is on `v3`
(`roualwaysright` keeps the earlier particle-portrait version); `main` is the PR target. Windows
machine (Git Bash / PowerShell).

## Commands

```
npm run dev          # http://127.0.0.1:4311 (strictPort)
npm run build        # dist/ from index.html only
npm run build:reference   # dev/ pages (Portrait Lab, lifecycle harness) → dist-reference/
npm run preview      # serves dist/ on 4312
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm test             # Vitest unit tests
npm run test:e2e     # build + build:preview + Playwright (starts its own servers)
npm run check        # everything above, in order
```

Single tests:

```
npx vitest run tests/unit/tokens.test.ts
npx vitest run -t "name of test"
npm run build && npx playwright test certificates --project=site-desktop
```

Playwright runs against the **production build** served by `vite preview` (4312), so rebuild before
running site specs. Projects: `site-desktop`/`site-mobile` (1440×900 / 390×844) for the site;
`lab-*` and `legacy-*` (particle engine in the dev Portrait Lab vs the original prototype on 4310,
WebGL on SwiftShader). No retries: a flaky test is treated as a bug.

## Architecture

- `src/app/App.tsx` composes the page from `src/sections/*`; each section takes a `SectionDef`
  from `src/content/site.ts` (id, theme, eyebrow, title). Section themes (Deep/Mid/Elevated/Light)
  live in `src/styles/tokens.css`; `tests/unit/tokens.test.ts` checks WCAG contrast of every
  text/background pair in every palette, so new colour pairs must pass it.
- **One palette, Jade Pavilion**: every colour is one of nine `--p-*` slots in `tokens.css`. Never
  write a literal colour in component CSS: use `var(--p-*)` or `color-mix(in srgb, var(--p-*) N%,
  transparent)`. Canvases can't read CSS variables, so they call `slot()`/`slotAlpha()`/`mixSlots()`
  from `src/features/palette/palette.ts` (Starfield, Events).
- **Star fields** (`src/components/Starfield.tsx`): one canvas per section, first child of a
  `.has-stars` section (`Section.tsx` adds it; Events, Projects, Certificates, Contact and the footer
  render their own). `tone='light'` on light sections draws deep green stars.
- **Page frame** (`src/components/layout/PageFrame.tsx`): a fixed 14 px forest mat (`--frame` in
  `tokens.css`). The header floats `--frame + 4px` from the top, the hero is pulled up under it
  (negative margin) so the photo starts at the top, and `--gutter` includes the mat's width.
- **All copy and data live in `src/content/`**, never inline in components. Every claim follows
  `docs/CONTENT_APPROVAL.md` (verified / cv-reported / pending / excluded); a `pending` claim is
  left out of the content, never rendered. Education and internship entries list their
  certificates by id (`certificates: [...]`), opened in the shared `CertificateDialog`.
  Education and internships render as one timeline (`Timeline` in `Experience.tsx`, `Timeline.css`):
  `learning` merges them sorted by `start`; desktop uses a subgrid so cards alternate above and below the line.
- **Particle portrait** (`src/features/particle-portrait/`): no longer used by the site (v3); it
  stays for the dev Portrait Lab. `createParticleRenderer` returns either a controller or `{ fallback }`. `legacy/particle-portrait/` is the byte-identical original,
  guarded by MD5s in `tests/unit/legacy-integrity.test.ts`: **never edit it**; fix defects in the
  maintained module. Parity specs compare the two.
- **Event scenes** (`src/features/recognition/`) are pure functions of a progress `p` in 0..1.
  `Events.tsx` is a slideshow on one stage: it drives `p` over 5 s for the active moment, rests
  4 s, then advances (stops once the visitor uses the tabs, ‹ › or a swipe). The figures are
  placed at the measured photo box (`view.cx`, `view.ground`).
- **Reduced motion** (`src/features/motion/`): every animated feature has a still state (events
  become static prints, rows stop, stars draw one frame); e2e tests check it. There is no
  on-screen pause control.
- Links to a section (`/#contact`) are scrolled to on load in `App.tsx`.
- `dev/` holds development-only pages; the production-build e2e test asserts that no lab pages,
  source PNGs or PDFs end up in `dist/`.
- Contact form: `VITE_CONTACT_MODE=mailto|service` (+ `VITE_FORM_ENDPOINT`) in `.env.local`.

## Generated assets (Python)

The scripts run from the project-local venv `tools/.venv` (git-ignored) with PyMuPDF and Pillow:
`tools/.venv/Scripts/python.exe scripts/<name>.py`. Review images go to `.review/` (git-ignored).

**Hero photograph.** `content-source/portrait/originals/muhammed-farrag-avenue.jpg` → three WebP in
`src/assets/hero/` (2400 and 1200 wide, and a 900×1000 crop centred on him for phones), made with
Pillow; see `content-source/portrait/README.md`. (`scripts/portrait-photo.py` and
`portrait-assets.mjs` belong to the earlier particle hero.)

**Certificates.** `My Own Certificates/` is the owner's untracked drop folder. Unique PDFs are copied
into `content-source/certificates/originals/` (never published). Then:

```
tools/.venv/Scripts/python.exe scripts/certificates.py preview   # contact sheet + parsed details
tools/.venv/Scripts/python.exe scripts/certificates.py export    # src/assets/certificates/*.webp + certificates.data.json
```

The script dedupes by SHA-256, parses the Coursera text layer, and uses `OVERRIDES` (keyed by PDF
stem) for any other layout, such as Specializations, non-Coursera issuers or broken glyphs. Check
each new certificate against its rendered image. The topic sticker comes from the title regexes in
`src/content/certificates.ts` (first match wins; a new topic also needs a sticker colour in
`CertificateDialog.css`). After adding certificates, update the count in
`tests/e2e/certificates.spec.ts`, `README.md` and `content-source/certificates/README.md`.
The Windows console shows non-ASCII as `�`; check the JSON, not the console output.

## Conventions

- Commits: Conventional Commits with a scope, e.g. `feat(certificates): …`, `fix(a11y): …`.
- Dependencies are pinned to exact versions.
- Comments explain *why* and record measurements and dates; match that density.
