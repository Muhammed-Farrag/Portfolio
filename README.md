# Muhammed Farrag — Portfolio

Personal portfolio of Muhammed Farrag, Applied AI Engineer. Built with Vite, React 18 and
TypeScript. The hero is his original Particle Portrait, a WebGL renderer.

On the first visit in a browser tab, the site plays itself as a short cinematic sequence: each
section arrives with its own transition and stays long enough to read. Any scroll, key, tap or
navigation click hands the page back to the visitor, who then has a normal scrolling site with
a glass navbar.

## The page

| Section | What it shows |
|---|---|
| **Hero** | The particle portrait over a field of stars that link up near the pointer. Hovering, tapping or focusing the portrait reveals the photograph. |
| **Important Events** | Three scroll-driven scenes drawn as halftone dots, whose dots gather into the real photograph as it lands as a polaroid print: the Best Creativity Trophy (RoboRAVE, Beijing 2025), Top Digital Pioneer (DEPI, 2026), and Official Judge (RoboRAVE Egypt, 2026). A still galaxy behind the finale. |
| **Work experience** | Cluster, TJM Labs and freelance work (12+ clients), over a still nebula. |
| **Internships & Education** | Two columns: STC and ITI; GCI World 2026 (University of Tokyo), DEPI and the B.Sc. in AI Science. |
| **Projects** | HELIOS, NovaCare and Lumina, each with an interactive visual and its GitHub link, over a still starfield and a planet's rim. |
| **Certificates** | 28 certificates in two drifting rows; each opens in full. |
| **Contact** | Email, LinkedIn, GitHub and a message form. |

Palette: a Desert Titanium night sky. Void `#15120F`, Umber `#221D18`, Sandstone `#3A3129`,
Desert Titanium `#BFA48F` and Ivory `#F4EEE4`, with Titanium Light, Dune and Bronze tones and two
nebula tints used only in the still space backdrops (`src/styles/tokens.css`). Every text and background pair is checked
against WCAG contrast by a unit test.

## Getting started

Requirements: Node 20 or later (24 in `.nvmrc`) and npm. The browser tests need Chromium:
`npx playwright install chromium`.

```
npm ci
npm run dev        # http://127.0.0.1:4311
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 4311. Draft and in-progress marks are visible here. |
| `npm run build` | Production build into `dist/`. Draft marks never render, and no PDF is ever included. |
| `npm run preview` | Serves `dist/` on port 4312. |
| `npm run typecheck` | TypeScript, strict mode. |
| `npm run lint` | ESLint. |
| `npm test` | Unit tests (Vitest). Also prints the list of open drafts. |
| `npm run test:e2e` | Builds, then runs the Playwright suite. It starts the servers it needs. |
| `npm run check` | All of the above, in order. |
| `npm run serve:legacy` | Serves the untouched original prototype on port 4310. |

## Contact form settings

Copy `.env.example` to `.env.local` (git-ignored):

| Setting | Meaning |
|---|---|
| `VITE_CONTACT_MODE=mailto` | Default. The form writes the message out and offers four ways to send it: the email app, Gmail, Outlook.com, or copying the text. |
| `VITE_CONTACT_MODE=service` | Posts the message as JSON to `VITE_FORM_ENDPOINT`, e.g. a Formspree form. Without an endpoint it falls back to `mailto`. |

In development, a switch on the form tries both.

## Content

All text lives in `src/content/`. Each statement follows `docs/CONTENT_APPROVAL.md`.

| File | Holds |
|---|---|
| `site.ts` | Profile, navigation and section titles. |
| `events.ts` | The three important events and their photographs. |
| `experience.ts` | Work, internships and education. |
| `projects.ts` | The project case studies. |
| `certificates.ts` | Generated from the certificate PDFs (below). |
| `drafts.ts` | Collects every entry marked `draft`. |

**Drafts.** Details the owner has not confirmed yet carry a `draft` note. In development they
show a dashed **Draft** mark; production renders the entry without it. `npm test` prints the
full list, so none is forgotten.

**Certificates.** The PDFs are in `content-source/certificates/originals/` and are never
published. `scripts/certificates.py` renders page 1 of each to WebP and reads title, issuer and
date from the PDF itself. It runs from a project-local Python environment with PyMuPDF and
Pillow; see `content-source/certificates/README.md`.

**Photographs.** Event photographs and the hero cut-out come from `content-source/`. Each folder
has a README that explains how its images were made (`scripts/portrait-photo.py` for the cut-out).
The small density masks the event scenes gather into (`src/assets/recognition/*.mask.webp`) come
from `scripts/recognition-silhouettes.py` (rembg `birefnet-portrait` in `tools/.venv`).

## Layout

```
src/app/                       Page composition
src/components/                Header (glass navbar), section frame, footer, <Pending> marks
src/sections/                  Hero, events/, experience/, projects/, certificates/, Contact
src/features/
  cinema/                      The opening sequence: a pure timing director and its runtime
  particle-portrait/           The WebGL portrait engine
  recognition/                 The event scenes: figures, actors, halftone drawing and the gather
  contact/                     Form checks and delivery
  motion/                      Reduced-motion preference and scroll reveals
src/content/                   Text and data (see Content)
src/assets/                    Portrait, event photos, certificate images, still backdrops
src/styles/                    Design tokens, section themes, backdrops
content-source/                Originals: portrait, event photographs, certificate PDFs
scripts/                       Asset generators (portrait, certificates, event photo masks)
legacy/particle-portrait/      Byte-identical copy of the original prototype (never edited)
dev/                           Development pages only (Portrait Lab, lifecycle harness)
tests/unit/, tests/e2e/        Vitest and Playwright
docs/                          Design specification, source audit, content approval register
```

## How it moves

- **Opening sequence** (`src/features/cinema/`). Each section is a scene (`data-beat`). It holds
  for its animation or for long enough to read 80% of its words at 220 words a minute, whichever
  is longer. It plays once per browser tab. It is skipped for reduced motion and for links to a
  section (e.g. `/#contact`). On screen: a progress pill with Pause and Skip intro.
- **Transitions.** Each section has its own: warp, clouds, wipe, ripple, cards and rays. After the
  sequence they play when the visitor scrolls down into a section.
- **Event scenes.** Pure functions of scroll position. They never lag, reverse exactly and can be
  skipped. Each ends on the real photograph, and the figure is labelled "Symbolic animation".
- **Reduced motion.** No sequence, no event scenes. Photographs and text are shown as they are,
  and the certificate rows stand still and scroll sideways.

## Particle Portrait engine

```ts
import { createParticleRenderer, PORTFOLIO_BACKGROUND } from './src/features/particle-portrait';

const result = createParticleRenderer(canvas, image, {
  pointerTarget: stage,        // element whose pointer movement displaces particles
  sizeTarget: stage,           // element whose box sizes the canvas
  paused: matchMedia('(prefers-reduced-motion: reduce)').matches,
  settings: { tone: 'moonlight', background: PORTFOLIO_BACKGROUND },
});
if ('fallback' in result) showStaticImage(result.fallback); // 'no-webgl' | 'shader-error' | 'tainted-image'
else {
  result.setExit(0.5);         // disperses the particles (the Hero uses it as you scroll away)
  result.scatter();
  result.dispose();            // removes every listener and observer and stops the loop
}
```

Sampling, physics and pointer behaviour are unchanged from the original prototype. The engine
stops drawing off-screen or in a hidden tab, and rebuilds itself after a lost WebGL context.
Density adapts to the device: Ultra (10,203 points) on capable desktops, Fine (4,525) on small or
modest devices, and Soft (2,549) with Save-Data. Without WebGL, the Hero shows a still frame.

## Tests

- **Unit (Vitest).** Contrast of every colour pair, the sequence timing, the event figures
  (feet on the ground, the certificate hand-off, the claps), contact form checks, the drafts
  list, and the engine's parity with the prototype.
- **Browser (Playwright, Chromium).** Runs at 1440×900 and 390×844:
  - the public site: structure, navigation, themes, overflow, axe accessibility scan, and the
    production build;
  - each section's behaviour;
  - the live portrait and the opening sequence;
  - the original prototype against the maintained engine.

  WebGL runs in software, so no GPU is needed. Nothing is retried.

## Repository

Work happens on the `roualwaysright` branch of
[Muhammed-Farrag/Portfolio](https://github.com/Muhammed-Farrag/Portfolio).
