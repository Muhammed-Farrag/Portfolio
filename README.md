# Muhammed Farrag — Portfolio

Personal portfolio of Muhammed Farrag, Applied AI Engineer. Built with Vite, React 18 and
TypeScript. One scrolling page with a glass navbar, in one palette, Jade Pavilion; every section
after the hero sits over a field of twinkling stars that wake and link up near the pointer.

## The page

| Section | What it shows |
|---|---|
| **Hero** | A still photograph of him centred on a tree-lined avenue, from the very top of the page. MUHAMMED (outlined), the role and GitHub and LinkedIn buttons on the left, FARRAG and the headline on the right. On phones a crop centred on him, the name, headline and buttons below it. |
| **Important Events** | A slideshow of three moments on one stage, with tabs and ‹ › buttons (or a swipe). Each moment's halftone scene plays by itself for 5 s, its dots gather into the photograph, framed and rounded, over a blurred enlargement of it that fills the stage; after 4 s the next moment follows, until the visitor takes over. The Best Creativity Trophy (RoboRAVE, Beijing 2025), Top Digital Pioneer (DEPI, 2026), and Official Judge (RoboRAVE Egypt, 2026). |
| **Work experience** | Cluster, TJM Labs and Fabelian, his own studio (12+ clients, linked to its Instagram), as three glass cards side by side; hovering one brings it forward at 140%. |
| **Education & Internships** | One timeline, oldest first: the B.Sc. in AI Science, the STC and ITI internships, DEPI and GCI World 2026 (University of Tokyo). On desktop a line runs across with a node per entry and its card above or below in turn; on phones the line runs down the left. Cards with a certificate show it as a thumbnail that opens in full. |
| **Projects** | HELIOS, NovaCare and Lumina, each with an interactive visual and its GitHub link. |
| **Certificates** | 37 certificates in two drifting rows; each opens in full. |
| **Contact** | The heading across the full width; Email, LinkedIn and GitHub on the left, the message form on the right. |

Palette: Jade Pavilion, measured from the Summer Palace photograph. Forest `#121C17`, Mid
`#1C2A23`, Raised `#2F4438`, Jade `#8FB09B` and Parchment `#F3EFE2`, with lighter jade tones and a
pale light ground (`src/styles/tokens.css`). Every text and background pair is checked against
WCAG contrast by a unit test.

**Page frame.** A 14 px forest mat around the viewport with rounded inner corners, like a framed
print (`src/components/layout/PageFrame.tsx`, `--frame` in `tokens.css`). The header floats 4 px
inside it, the hero photograph starts at the very top under the header, and the page gutter
starts inside the mat.

## Getting started

Requirements: Node 20 or later (24 in `.nvmrc`) and npm. The browser tests need Chromium:
`npx playwright install chromium`.

```
npm ci
npm run dev        # http://127.0.0.1:4311
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 4311. |
| `npm run build` | Production build into `dist/`. No PDF is ever included. |
| `npm run preview` | Serves `dist/` on port 4312. |
| `npm run typecheck` | TypeScript, strict mode. |
| `npm run lint` | ESLint. |
| `npm test` | Unit tests (Vitest). |
| `npm run test:e2e` | Builds, then runs the Playwright suite. It starts the servers it needs. |
| `npm run check` | All of the above, in order. |
| `npm run serve:legacy` | Serves the untouched original particle prototype on port 4310. |

## Contact form settings

Copy `.env.example` to `.env.local` (git-ignored):

| Setting | Meaning |
|---|---|
| `VITE_CONTACT_MODE=mailto` | Default. The form writes the message out and offers four ways to send it: the email app, Gmail, Outlook.com, or copying the text. |
| `VITE_CONTACT_MODE=service` | Posts the message as JSON to `VITE_FORM_ENDPOINT`, e.g. a Formspree form. Without an endpoint it falls back to `mailto`. |

## Content

All text lives in `src/content/`. Each statement follows `docs/CONTENT_APPROVAL.md`.

| File | Holds |
|---|---|
| `site.ts` | Profile, navigation and section titles. |
| `events.ts` | The three important events and their photographs. |
| `experience.ts` | Work, education and internships (merged into `learning` for the timeline, by `start` date), with the certificates that belong to each entry. |
| `projects.ts` | The project case studies. |
| `certificates.ts` | Generated from the certificate PDFs (below). |

**Certificates.** The PDFs are in `content-source/certificates/originals/` and are never
published. `scripts/certificates.py` renders page 1 of each to WebP and reads title, issuer and
date from the PDF itself. It runs from a project-local Python environment with PyMuPDF and
Pillow; see `content-source/certificates/README.md`. An education or internship entry names its
certificates by id (`certificates: ['stc']` in `experience.ts`).

**Photographs.** The hero photograph and the event photographs come from `content-source/`. Each
folder has a README that explains how its images were made. The small density masks the event
scenes gather into (`src/assets/recognition/*.mask.webp`) come from
`scripts/recognition-silhouettes.py` (rembg `birefnet-portrait` in `tools/.venv`).

## Layout

```
src/app/                       Page composition
src/components/                Header (glass navbar), section frame, Starfield, page frame, social icons
src/sections/                  Hero, events/, experience/, projects/, certificates/, Contact
src/features/
  recognition/                 The event scenes: figures, actors, halftone drawing and the gather
  contact/                     Form checks and delivery
  motion/                      Reduced-motion preference and scroll reveals
  palette/                     Slot colours for canvases
  particle-portrait/           The WebGL portrait engine (dev Portrait Lab only since v3)
src/content/                   Text and data (see Content)
src/assets/                    Hero photograph, event photos, certificate images
src/styles/                    Design tokens and section themes
content-source/                Originals: photographs, certificate PDFs
scripts/                       Asset generators (certificates, event photo masks, portrait)
legacy/particle-portrait/      Byte-identical copy of the original prototype (never edited)
dev/                           Development pages only (Portrait Lab, lifecycle harness)
tests/unit/, tests/e2e/        Vitest and Playwright
docs/                          Design specification, source audit, content approval register
```

## How it moves

- **Star fields** (`src/components/Starfield.tsx`). Behind every section after the hero: light
  stars on dark grounds, deep green stars on light ones. They twinkle, and the pointer wakes the
  stars within 150 px, which brighten and join with faint lines. A field draws only while its
  section is on screen.
- **Event slideshow.** Once the stage is half on screen the active moment plays over 5 s and ends
  on its photograph; 4 s later the next one plays, looping, until the visitor uses a tab, a ‹ ›
  button or a swipe. Off screen it waits.
- **Elsewhere.** Text blocks rise in behind a wipe as they reach the screen; the certificate rows
  drift (hovering a row stops it); the HELIOS sun spins and Lumina's planets orbit; cards lift
  and links underline on hover.
- **Reduced motion.** No event scenes (the prints and titles are shown as they are), still star
  fields, still certificate rows that scroll sideways, frozen project visuals, no text wipes.

## Tests

- **Unit (Vitest).** Contrast of every colour pair, the event figures (feet on the ground, the
  certificate hand-off, the claps), contact form checks, and the particle engine's parity with
  the prototype.
- **Browser (Playwright, Chromium).** Runs at 1440×900 and 390×844:
  - the public site: structure, navigation, themes, overflow, axe accessibility scan, and the
    production build;
  - each section's behaviour: the hero, the events playing and replaying, the certificates (and
    an entry's own certificates), the projects, the contact layout and form;
  - the original prototype against the maintained engine (Portrait Lab).

  Nothing is retried.

## Repository

Branches of [Muhammed-Farrag/Portfolio](https://github.com/Muhammed-Farrag/Portfolio): `v3` is
this version; `roualwaysright` keeps the particle-portrait version with the palette switcher.
