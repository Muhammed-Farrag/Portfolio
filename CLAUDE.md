# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Personal portfolio of Muhammed Farrag (Applied AI Engineer): Vite 5 + React 18 + TypeScript (strict),
no UI framework, plain CSS. One page of sections; the hero is a custom WebGL particle portrait.
Work happens on the `roualwaysright` branch; `main` is the PR target. Windows machine (Git Bash / PowerShell).

## Commands

```
npm run dev          # http://127.0.0.1:4311 (strictPort). Draft marks visible here only.
npm run build        # dist/ from index.html only
npm run build:reference   # dev/ pages (Portrait Lab, lifecycle harness) → dist-reference/
npm run preview      # serves dist/ on 4312
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm test             # Vitest unit tests (also prints open drafts)
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
running site specs. Projects: `site-desktop`/`site-mobile` (1440×900 / 390×844), `site-webgl-*`
(hero, cinema; one worker, 120 s), `lab-*` and `legacy-*` (portrait engine vs the original
prototype on 4310). WebGL runs on SwiftShader. No retries: a flaky test is treated as a bug.

## Architecture

- `src/app/App.tsx` composes the page from `src/sections/*`; each section takes a `SectionDef`
  from `src/content/site.ts` (id, theme, eyebrow, title). Section themes (Deep/Mid/Elevated/Light)
  live in `src/styles/tokens.css`; `tests/unit/tokens.test.ts` checks WCAG contrast of every
  text/background pair in every palette, so new colour pairs must pass it.
- **Palettes** (`src/features/palette/`): every colour is one of eleven `--p-*` slots. Desert
  Titanium (the owner's) is `:root`; the photo palettes redefine the slots under
  `:root[data-palette]`. Never write a literal colour in component CSS: use `var(--p-*)` or
  `color-mix(in srgb, var(--p-*) N%, transparent)`. Canvases can't read CSS variables, so they
  call `slot()`/`slotRgb()` and listen with `onPaletteChange` (HeroPortrait, HeroStars, Events).
  The backdrop SVGs are drawn in Desert Titanium hex; `backdrops.ts` swaps those hex values for
  slots at runtime. Adding a palette means: a block in `tokens.css`, an entry in `PALETTES`, and
  its id in the pre-paint regex in `index.html` (all three are checked by the tokens test).
- **All copy and data live in `src/content/`**, never inline in components. Every claim follows
  `docs/CONTENT_APPROVAL.md` (verified / cv-reported / pending / excluded). Unconfirmed details
  carry a `draft` note: a dashed Draft mark in dev, absent in production; `drafts.ts` collects them
  and `npm test` lists them. A `pending` claim must never render in a release build.
- **Opening sequence** (`src/features/cinema/`): sections are scenes marked with `data-beat`,
  `data-beat-min` and `data-beat-effect` attributes. A pure timing director (unit-tested) plus a
  runtime. Plays once per tab; skipped for reduced motion and deep links like `/#contact`.
- **Particle portrait** (`src/features/particle-portrait/`): `createParticleRenderer` returns either
  a controller or `{ fallback }`. `legacy/particle-portrait/` is the byte-identical original,
  guarded by MD5s in `tests/unit/legacy-integrity.test.ts`: **never edit it**; fix defects in the
  maintained module. Parity specs compare the two.
- **Event scenes** (`src/features/recognition/`) are pure functions of scroll position.
- **Reduced motion / Pause** (`src/features/motion/`): a site-wide pause control (WCAG 2.2.2).
  Every animated feature must have a still state; e2e tests check it.
- `dev/` holds development-only pages; the production-build e2e test asserts that no lab pages,
  source PNGs or PDFs end up in `dist/`.
- Contact form: `VITE_CONTACT_MODE=mailto|service` (+ `VITE_FORM_ENDPOINT`) in `.env.local`.

## Generated assets (Python)

The scripts run from the project-local venv `tools/.venv` (git-ignored) with PyMuPDF and Pillow:
`tools/.venv/Scripts/python.exe scripts/<name>.py`. Review images go to `.review/` (git-ignored).

**Hero photograph.** `scripts/portrait-photo.py` (`scene` for the photograph with its background, which
the owner wants kept; `particles` for the person-only particle source) makes both Hero layers from one
crop of `content-source/portrait/originals/`, then `node scripts/portrait-assets.mjs`
(dev server up) renders the no-WebGL fallback. The particle point counts are asserted in
`tests/e2e/hero.spec.ts`; see `content-source/portrait/README.md`.

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
`Certificates.css`). After adding certificates, update the count in
`tests/e2e/certificates.spec.ts`, `README.md` and `content-source/certificates/README.md`.
The Windows console shows non-ASCII as `�`; check the JSON, not the console output.

## Conventions

- Commits: Conventional Commits with a scope, e.g. `feat(certificates): …`, `fix(a11y): …`.
- Dependencies are pinned to exact versions.
- Comments explain *why* and record measurements and dates; match that density.
