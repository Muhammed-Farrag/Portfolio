# Design Specification

**Status:** Approved direction (Phase 0), amended 14 Oct 2026 with the owner's additions listed under "Amendments".
**Internal codename:** THE ARCHITECT. The codename never appears in public copy, metadata, URLs or alt text. The public professional title is **Applied AI Engineer** unless the owner verifies a different one.

## 1. Principles

- The Particle Portrait is the primary visual centerpiece and the only bold element on the page. Every other element stays quiet.
- Every public claim maps to an entry in `CONTENT_APPROVAL.md` with status `verified` or `cv-reported`. Nothing marked `pending` is rendered in a release build.
- All content is HTML text. WebGL, scroll animation and interactions are progressive enhancements.
- Motion must communicate one of three things: data becoming form, flow through a system, or order in time. Anything else stays still.
- Native scroll only. No smooth-scroll hijacking, no global cursor followers, no autoplay audio, and the camera is never touched.

## 2. Tokens

| Token | Value | Use | Contrast on `--bg` |
|---|---|---|---|
| `--bg` | `#0B0D12` | Page background and canvas clear color | — |
| `--surface` | `#151922` | Panels | — |
| `--surface-2` | `#202530` | Hover, layered panels | — |
| `--text` | `#F2EFE8` | Primary text | 16.9:1 |
| `--muted` | `#9CA3AF` | Supporting text | 7.7:1 |
| `--accent` | `#D5A66D` | Portrait amber, selection, the recognition thread | 8.8:1 |
| `--signal` | `#62DDEB` | Live paths and focus rings only | 12.1:1 |
| `--border` | `#343A46` | Decorative hairlines only | 1.7:1 |
| `--border-strong` | `#626A78` | Interactive outlines (WCAG 1.4.11) | 3.6:1 |

The prototype's ivory and green phosphor modes remain available in the portrait controls drawer and in `/lab`. They do not change the site palette.

## 3. Typography

- **Display:** Archivo, width 125%, weights 700–800, uppercase, for the name and section titles only.
- **Body:** Geist, 16–18 px, about 65 characters per line.
- **Mono:** JetBrains Mono, for labels, readouts, dates and diagram captions. Never for paragraphs.
- Fonts are self-hosted at build time. Fallbacks: `'Arial Narrow', system-ui` / `system-ui` / `ui-monospace, Consolas`.

## 4. Layout

A 12-column grid at 1280 px and above, 8 columns on tablet and 4 on phones. The side gutter is at least 16 px. Tested widths: 390, 768, 1280 and 1440 px.

## 5. Scenes

| # | Scene | Moves | Reduced motion |
|---|---|---|---|
| 01 | **Arrival: intelligence takes form.** Name, title, specialisms and CTAs as HTML. The particle portrait fills the right columns (desktop) or a square below the headline (mobile). | The portrait reforms using the original scatter curve from its REFORMING midpoint. Scroll progress drives the existing `uBurst` uniform on exit. Rendering stops when the hero is off-screen. | Paused, fully formed portrait. No intro and no scroll scatter. |
| 02 | **How he thinks: system constellation.** Intelligence → Orchestration → Product → Operations, each linking to the projects that use those tools. | The route draws once and one signal pulse travels along it. | Static route. |
| 03 | **Selected work.** Self-Healing, NovaCare, HELIOS, and a fourth case (see open decisions). Challenge / My contribution / Approach / Outcome / Links / Stack. The NovaCare 91.5% (29 classes, CV-reported, team project) sits in the NovaCare outcome. | CSS sticky visuals on desktop. HELIOS interaction (§6.1). | Static. |
| 04 | **Under the hood: Self-Healing.** A 9-step pipeline drawn from repository modules. | Pinned scroll steps (GSAP chapter 1 of 2). Self-Healing interaction (§6.2). | Static vertical chain with all captions. |
| 05 | **Beyond the Code** (amended, §7). | Pinned horizontal track on desktop (GSAP chapter 2 of 2). | Static vertical stories. |
| 06 | **Experience & evolution.** A true-scale Gantt timeline showing concurrent roles. | Bars grow along the time axis once. | Static bars. |
| 07 | **Human / contact.** The real photograph, "Let's build the next useful thing.", GitHub, LinkedIn, and email once approved. Colophon credits the portrait renderer and its EddyOS inspiration and links `/lab`. | Hover states only. | — |

The original "Proof" scene is merged into Scene 05 (recognition) and Scene 03 (the NovaCare metric sits in its case study). No count-up animations anywhere.

## 6. Project interactions (amendment 3)

Both are opt-in, built from HTML, CSS and SVG with a small script, under 8 KB gzip each. Both work fully with keyboard and screen readers, and neither loads a third-party library. They sit inside their case-study panels and never compete with the hero.

### 6.1 HELIOS: gesture console

- Three controls named after the real gestures from the HELIOS README: **Point to aim**, **Pinch to fire**, **Fist to reload**. Buttons and keys A / F / R.
- A brass 10-round magazine gauge depletes on fire. Reload completes after holding Fist for about 1 second. Hits within 1 second of each other build a combo multiplier. These rules come from the README.
- Inside the panel only, a brass reticle follows the pointer. It is hidden on touch devices and under reduced motion.
- Labeled "Simulation of the game's gesture logic. No camera is used on this page." The **Live demo** link goes to `https://helios-rouge.vercel.app` with the notice "Opens HELIOS in a new tab. It asks for camera access."

### 6.2 Self-Healing: inject a failure

- The visitor picks one of the five failure classes the repository's classifier reports: `http_error`, `missing_column`, `missing_db`, `missing_file`, `timeout`.
- An episode token travels through the Scene 04 pipeline: inject → parse → classify → retrieve → plan → govern → patch → validate → audit.
- A confidence control shows the governance branch, auto-patch or human review queue. The thresholds come from the repository. They are inconsistent across files (see `SOURCE_AUDIT.md`), so the values the simulation shows are blocked on owner confirmation.
- Labeled "Simulation in your browser. No backend and no model calls. The real system ran on injected failures."

## 7. Beyond the Code (amendments 1 and 2)

Three connected stories, not award cards. The thread that connects them is factual chronology from the CV: **a competitor in August 2025, an honoree in April 2026, and a judge in July 2026.**

| Story | Role | Date and place (CV) | Media status |
|---|---|---|---|
| Montura at RoboRAVE International | Competitor. Best Creativity Trophy | Aug 2025, Beijing, China | Owner photo supplied: holding a trophy on the RoboRAVE 2025 arena floor with the Egyptian flag |
| Digital Egypt Pioneers Initiative (MCIT) | Top Digital Pioneer Honoree | Apr 2026, Egypt | Owner photo supplied: DEPI ceremony with sash and certificate |
| RoboRAVE Egypt | Official Judge, Software, AI and Robotics | Jul 2026, Alexandria | **No media yet: marked placeholder** |
| Al-Ahram coverage | — | — | **Not rendered** until source material is supplied and verified |

**Composition (desktop):** one amber thread (SVG path) runs left to right through three chapters on a pinned horizontal track. Each chapter has a large photograph, a role word set in display type (COMPETITOR, HONOREE, JUDGE), a mono date stamp, a short factual story, and evidence chips ("Source: CV", "Photo: supplied by Muhammed"). Photographs are graded toward obsidian and amber at rest. The grade lifts to the original color when the chapter is active or focused, which is the one motion this scene has. A chapter label on the thread notes the 11 months between competing and judging.

**Mobile:** vertical stack with the thread running down the left edge, nothing pinned, images lazy-loaded with fixed aspect ratios.

**Placeholders:** a missing photograph renders a framed placeholder that states exactly what is missing, for example "PHOTO PENDING · RoboRAVE Egypt judging, Jul 2026". Placeholders appear in development and preview builds. A release check fails if any placeholder or `pending` claim would be rendered.

**Copy rules:** no rankings, country counts, leadership claims or team-size claims beyond the CV. "Led Montura", "Rank 1" and "20+ countries" stay out unless verified. Certificates are shown only if legible and approved, and nothing on a certificate is used as a claim unless it is also in an approved source.

**Image handling:** crop to the person and the event context, and keep incidental sponsor logos as background only. Never use logos as endorsements. Alt text describes the scene factually.

## 8. Performance and accessibility budgets

See the Phase 0 proposal. In short: initial JS ≤ 120 KB gzip before GSAP; LCP ≤ 2.5 s (mobile simulation); CLS ≤ 0.05; zero rAF callbacks while the hero is off-screen; axe reports zero serious or critical issues; Lighthouse a11y ≥ 95; full reduced-motion, no-WebGL and no-JS experiences.

## 9. Open decisions

1. Fourth featured case. Recommendation: Advanced LangChain, presented honestly as a course lab, because Montura is now covered prominently in Beyond the Code.
2. Self-Healing threshold values to show (§6.2).
3. Portrait source A/B (Phase 3).
4. Everything marked `pending` in `CONTENT_APPROVAL.md`.
