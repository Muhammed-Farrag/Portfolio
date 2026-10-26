# Design Specification

**Revision 5 (21 Oct 2026), owner-specified.** The owner replaced Moonlight & Storm with a **Desert Titanium night sky**: warm-black space grounds, Desert Titanium as the metal accent and Ivory text, with still space backdrops (a nebula, a starfield over a planet's rim, a galaxy) in place of clouds, water and sun rays. §2 is current. Older sections (§3, §5) still name the previous colours; read them through the mapping in §2.6. The architecture, typography and scene structure are unchanged.

**Internal codename:** THE ARCHITECT. The codename never appears in public copy, metadata, URLs or alt text. The public title is **Applied AI Engineer** unless the owner verifies a different one.

## 1. Principles

- The Particle Portrait is the primary visual centerpiece. No other effect competes with it.
- Every public claim maps to `CONTENT_APPROVAL.md` with status `verified` or `cv-reported`. Pending claims and placeholders never ship in a release build.
- All content is HTML text. WebGL, motion and interactions are progressive enhancements.
- Motion communicates data becoming form, flow through a system, or order in time. Nothing else moves.
- Native scroll. No cursor followers outside a scoped project demo, no autoplay audio, and the camera is never used.
- **Only the owner-specified palette and its blends.** Warm neutrals and the titanium-copper family for everything; one dust violet and one copper tint, in still backdrops only. A unit test rejects any saturated colour in `tokens.css` outside the titanium-copper band (12–40°) or the dust-violet band (255–280°), and any nebula tint used as a text, link, focus or control colour.

## 2. Color

### 2.1 Brand palette (owner-specified)

| Name | Hex | Role |
|---|---|---|
| Void | `#15120F` | Deep space: the Deep ground, the portrait's clear colour, text on light grounds |
| Sandstone | `#3A3129` | The Elevated ground, hairlines on dark, secondary text on light |
| Desert Titanium | `#BFA48F` | The metal accent: labels, outlines, the primary button's hover fill, props in the event scenes, the portrait's highlight |
| Ivory | `#F4EEE4` | Primary text; the primary button fill; the portrait's highlights; the main figures in the event scenes |

### 2.2 Derived supporting tones

| Token | Hex | Derived from | Use |
|---|---|---|---|
| Titanium Light | `#E8DCCB` | Titanium toward Ivory | The Light ground; secondary text on dark |
| Titanium Soft | `#D2BBA6` | Titanium, lightened | Tertiary text, links and focus on dark |
| Umber | `#221D18` | Void with Sandstone | The Mid ground; panels |
| Dune | `#DCCDB9` | Titanium Light with Titanium | Panels on light sections |
| Bronze | `#6B5747` | Titanium, darkened | Outlines and accents on light; the portrait's shadow tone |
| Copper nebula | `#8C5E4A` | — | Backdrops only |
| Dust violet | `#4A3A5C` | — | Backdrops only |

### 2.2a Visitor palettes (Revision 6, 25 Oct 2026)

Every colour above is one of eleven palette slots in `tokens.css` (`--p-deep` Void, `--p-mid`
Umber, `--p-raised` Sandstone, `--p-accent` Desert Titanium, `--p-soft` Titanium Soft, `--p-softer`
Titanium Light, `--p-paper` Ivory, `--p-panel` Dune, `--p-edge` Bronze, `--p-nebula` and
`--p-nebula-2`). Desert Titanium is the default. Four more palettes, measured from the Hero
photograph at the Summer Palace, redefine the same slots under `:root[data-palette]` and are
offered in the header's palette switcher:

| Palette | Deep | Accent | Light ground | From the photograph |
|---|---|---|---|---|
| Jade Pavilion | `#121C17` | `#8FB09B` | `#DDE6D8` | Trees and jade roofs |
| Misty Ridge | `#161D25` | `#9FB1C3` | `#E1E7EC` | Mountains and sky |
| Imperial Wall | `#1F1512` | `#D0976A` | `#EFE0CF` | Temple red, roof ochre, sandstone wall |
| Summer Lake | `#111D1F` | `#8EACA8` | `#DDE7E4` | Kunming Lake |

The theme roles below are the same in every palette, and the contrast test checks each one in
each palette. The hue-band rule in §1 applies to the default palette.

### 2.3 Contrast (WCAG 2.2, computed)

| Foreground | on Void | on Umber | on Sandstone | Allowed as |
|---|---|---|---|---|
| Ivory | 16.17 | 14.48 | 11.02 | All text |
| Titanium Light | 13.80 | 12.36 | 9.41 | All text on dark |
| Titanium Soft | 10.13 | 9.07 | 6.90 | Links, focus ring, labels |
| Desert Titanium | 7.93 | 7.10 | 5.40 | Labels, outlines, accents |
| Bronze | 2.74 | 2.45 | 1.86 | Never text on dark |

On the Light ground (Titanium Light / Dune panels): Void 13.80 / 11.98, Sandstone 9.41 / 8.16, Bronze 5.04 / 4.38 (outlines only).

### 2.4 Semantic tokens

The roles are unchanged (`--color-bg`, `--color-surface`, `--color-text`, `--color-link`, `--color-focal` and the rest); `tokens.css` maps them to the palette above. A unit test parses it and fails if any allowed text/background pair drops below its WCAG threshold, if a brand value changes, or if the portrait's colours drift from the tokens.

### 2.5 Section themes

| Theme | Ground | Panels | Text / secondary / labels | Links and focus | Primary button |
|---|---|---|---|---|---|
| `.theme-deep` | Void | Umber | Ivory / Titanium Light / Titanium Soft | Titanium Soft | Ivory, Void text; Desert Titanium on hover |
| `.theme-mid` | Umber | Void | Ivory / Titanium Light / Titanium Soft | Titanium Soft | Ivory, Void text |
| `.theme-elevated` | Sandstone | Void, Umber | Ivory / Titanium Light / Titanium Light | Ivory | Ivory, Void text |
| `.theme-light` | Titanium Light | Dune | Void / Sandstone / Sandstone | Void | Void, Ivory text; Sandstone on hover |

**Backdrops** (`src/styles/backdrops.css`, still SVGs that never move): `nebula` behind Work (dust-violet clouds lit with copper, a distant wisp), `orbit` behind Projects (a starfield tile over a planet's titanium-lit rim), `galaxy` behind the end of the Events (a titanium core and dotted spiral arms, where the prints land).

### 2.6 Reading older sections

Sections written for earlier revisions map as: Oxford Blue / Storm → Void, Midnight / Dusk → Umber, Steel → Sandstone, Frost Blue → Desert Titanium, Frost Light → Titanium Soft, Mist → Titanium Light, Moonlight → Ivory, Dawn → Dune.

### 2.7 Pause motion

The Hero's ambient particle motion runs indefinitely, so WCAG 2.2.2 requires a way to stop it. A "Pause motion" button on the portrait (bottom right on desktop; a 44 px icon button top right on small screens) toggles a site-wide preference. It starts from `prefers-reduced-motion`, is remembered once chosen, and every particle scene obeys it: paused means a still frame, no entrance and no scroll-driven effect.

## 3. Particle Portrait color adaptation

The engine, sampling, physics, pointer interaction, scatter/reform and controls are unchanged. The only changes are:

1. **Clear color as a setting** (done in Phase 1). The site uses Oxford Blue.
2. **One new tone branch in the vertex shader's existing color block.** It adds three color uniforms; the position and physics code is untouched. The point's luminance (already computed as `lum`) maps along a ramp from Steel (shadows) to Moonlight (highlights), so the portrait reads primarily as Moonlight on Oxford Blue. Source pixels with a strongly red hue, the tie in the portrait, map to a Steel → Frost Blue ramp as the one cool highlight. The red-hue test runs on the existing `aColor` attribute.
3. The original tones (amber from the image, warm ivory, terminal green) remain in the shader for parity testing, but the public site never offers them. The site's controls drawer offers the Moonlight tone (and, if wanted, a Moonlight-only monochrome variant) only. In the engine this tone is `tone: 'moonlight'`, with `PORTFOLIO_BACKGROUND` and `PORTFOLIO_PALETTE`.
4. The **static fallback image** and the **Source** view must not show the amber PNG. A paused frame from the engine itself is the Moonlight-on-Oxford WebP fallback (`src/assets/portrait/fallback.webp`, regenerated by `scripts/portrait-assets.mjs`). The engine samples a lossless 600×600 WebP copy of the portrait, so the amber PNG is never shipped.
5. **Portrait Lab (decided):** the original amber prototype is kept for regression testing only. `legacy/particle-portrait/` is the untouched reference, and `dev/lab/` is its interface running on the maintained engine. Both are development and test pages. They are never production routes, are noindex, and are not linked from the site. The production build (Phase 2) must not include anything under `dev/` or `legacy/`.

Phase 3 A/B tests the ramp endpoints and the tie accent against the real portrait. The owner approves the result.

6. **Story hooks (Phase C).** Three more shader insertions, all inert at their defaults: a morph towards a second shape (`aTarget`, `uMorph`, applied after the per-point seed is taken from the original position) and a framing offset (`uOffset`) so the portrait can be drawn inside any rectangle of a larger, transparent canvas. The Lab parity tests run the engine with these at their defaults and still match the prototype pixel for pixel.

## 4. Typography and layout

Unchanged. Archivo (display, width 125%, uppercase for the name and section titles), Geist (body), JetBrains Mono (labels and readouts). A 12/8/4 column grid with a gutter of at least 16 px. Tested at 390, 768, 1280 and 1440 px.

## 5. Scenes and color roles

| # | Scene | Color treatment | Motion |
|---|---|---|---|
| 01 | Arrival: the hero and Particle Portrait | Oxford Blue ground with a faint Storm depth behind the portrait; Moonlight particles with Frost Blue highlights; Moonlight name; Frost Blue eyebrow and specialism markers; Mist specialisms. Primary CTA is a Moonlight fill with Oxford Blue text (Frost Blue on hover); secondary CTAs have Frost Blue outlines and a Steel hover fill. | Reform intro from the original scatter curve, scroll-driven `uBurst` on exit, render loop stops off-screen. Headline masked reveal. |
| 02 | How he thinks: system constellation | Mid ground. The portrait's own particles form four layers (Intelligence, Orchestration, Product, Operations): Moonlight cores, rings and a Steel route, with a faint field of stars; HTML labels in Moonlight with Frost Blue indices. The still SVG uses Frost Blue rings, Steel route and Moonlight cores. | Built in Phase C: scroll carries the portrait from its slot to the figure, dispersing (uBurst, eased), morphing (uMorph) and dimming while it travels. Scroll-linked, reversible, no lock. Links to projects pending. |
| 03 | Selected work | Storm case panels; the NovaCare attribution map shows his modules in Frost Light and teammates' in Steel with Mist labels | Sticky visuals, hover preview swap, HELIOS gesture console |
| 04 | Under the hood: Self-Healing | Midnight section, Storm diagram panel, Steel edges, the active step as a Moonlight fill with Oxford Blue text and a Frost Light path | Pinned scroll steps, inject-a-failure simulation |
| 05 | Beyond the Code: recognition | Storm chapters on Oxford Blue, a Frost Light thread, Moonlight nodes, photographs with an Oxford/Moonlight duotone grade at rest | Pinned horizontal track on desktop; the grade lifts and a halftone-dot reveal plays when a chapter is active |
| 06 | Experience and evolution | Gantt bars in Storm with Steel edges, the current role in Frost Blue, pending roles dashed in Frost Blue | Bars grow once along the time axis |
| 07 | Contact and footer | Real photograph with a subtle Oxford grade, the CTA headline in Moonlight with "useful" in Frost Light, the footer on Midnight | Hover states only |

## 6. Project interactions

### 6.1 HELIOS: gesture console

Controls for **Point to aim**, **Pinch to fire** and **Fist to reload** (buttons, plus keys A / F / R). A 10-round gauge, about a 1 s reload hold, and a 1 s combo window, all from the README. A scoped reticle follows the pointer inside the panel only, and is hidden on touch and under reduced motion. Label: "Simulation of the game's gesture logic. No camera is used on this page." The live demo link goes to `helios-rouge.vercel.app` with a camera notice.

### 6.2 Self-Healing: inject a failure

The visitor picks one of the five real failure classes, and an episode moves through the nine pipeline steps. A confidence control shows the governed branch, auto-patch or human review queue, as an **illustrative workflow with no numeric threshold presented as fact**. Code tracing (see `SOURCE_AUDIT.md`) shows that the enforced rule is "the model flags plans for review, and anything below 0.5 is always flagged". The dashboard's settings values are not used by the pipeline. Numbers appear only after Muhammed confirms them. Label: "Simulation in your browser. No backend and no model calls."

## 7. Beyond the Code

Three connected stories with factual chronology from the CV: **competitor (Aug 2025) → honoree (Apr 2026) → judge (Jul 2026)**. A fourth, Al-Ahram press, is pending verification and never renders in release until it is verified.

- **Desktop:** a pinned horizontal track. One Frost Light thread runs through Moonlight nodes. Each chapter has a photograph, a role word in display type, a mono date and place stamp, a short factual story, and evidence chips such as "Source: CV" and "Photo: supplied by Muhammed".
- **Mobile:** stacked vertically, with the thread running down the left edge and nothing pinned.
- **Photographs:** an editorial crop at a fixed aspect ratio. At rest they show a duotone grade of Oxford Blue shadows and Moonlight highlights. When a chapter becomes active, a halftone-dot reveal (a visual echo of the particle portrait) lifts it to full color. There is no Ken Burns pan.
- **Asset system:** `content-source/recognition/<nn-story>/originals/` plus `manifest.json`, which records the claim, status, sources, slots, alt text, credit, consent and focal point. The build generates AVIF/WebP at 480, 960 and 1440 px and strips all metadata, including GPS.
- **Placeholders:** a slot whose file is null renders a Midnight frame at the slot's final aspect ratio (so nothing shifts when the photo arrives), with a dashed Frost Blue border and a mono label stating exactly what is missing. Placeholders appear in development and preview builds only. **Production never shows a placeholder:** a story whose required image is missing is shown in its text-only layout when its claim is approved, an optional slot without a file is omitted, and a story whose claim is unverified is not rendered. A missing optional asset never blocks deployment. The release check fails only if a placeholder or an unapproved claim or image would actually render.
- **No fabricated images:** no generated, composited or stock images, and no claims taken from photographs or certificates unless they are approved in the register.

## 8. React Bits

The React Bits MCP is not connected to this Claude Code session. The components below were evaluated from the public source (`DavidHDev/react-bits`, MIT + Commons Clause, which allows use inside a website but not redistribution of the components themselves). React Bits components are copied in as source, so each one is re-tokenized, given a reduced-motion guard where it lacks one, and audited for accessibility before use. The project's motion library stays **GSAP** (already planned), so components that depend on `motion` are excluded.

| Need | Use | Dependencies | Notes |
|---|---|---|---|
| Text reveal | **MaskedHeading** for section titles; **SplitText** for the hero name only | gsap (+ SplitText plugin) | MaskedHeading already handles reduced motion. SplitText needs a guard, and a test that the heading's accessible name is still the whole string. |
| Section transitions | **AnimatedContent** (one shared preset, about 16 px rise and fade, once) | gsap, ScrollTrigger | Needs a reduced-motion guard. Content must be visible without JS; no `opacity:0` in CSS. |
| Interactive project previews | **PixelTransition** (screenshot ↔ architecture diagram on hover or focus) | none | Keyboard focus must trigger it. Tested for reduced motion. |
| Subtle hover | **SpotlightCard** on case panels, with a Frost Blue spotlight at low opacity | none | Disabled on touch. |
| Recognition interactions | **HalftoneReveal** for the photo grade lift; **GradualBlur** for the track edges | none | HalftoneReveal echoes the particle dots. Used on at most 3 images. |

**Not used:** all Backgrounds (they would compete with the portrait; *Particles* in particular must never stand in for the original renderer), cursor effects (TargetCursor, SplashCursor, BlobCursor), CountUp and Counter (no count-ups), DecryptedText, ScrambledText and GlitchText (unreadable to screen readers and visually clichéd), TiltedCard and BlurText (depend on `motion`), ScrollStack (fights native scroll), and Stepper and AnimatedList (pull in an icon library). The total budget for React Bits code is ≤ 25 KB gzip, and it is loaded after the hero.

## 9. Budgets

Initial JS ≤ 120 KB gzip before GSAP and React Bits. LCP ≤ 2.5 s (mobile simulation). CLS ≤ 0.05. Zero rAF callbacks while the hero is off-screen. axe reports zero serious or critical issues, and Lighthouse a11y is at least 95. The reduced-motion, no-WebGL and no-JS experiences are complete.

## 10. Open decisions

1. ~~Approve revision 2~~ approved 14 Oct 2026. Approve revision 3 (Moonlight & Oxford palette): pending.
2. ~~`/lab`~~ decided: development and test only (§3.5).
3. Self-Healing threshold values: the simulation is illustrative until confirmed (§6.2).
4. Fourth featured case (recommendation: Advanced LangChain as a course lab).
5. Higher-resolution originals of the two supplied photos, plus the judge photos and the Al-Ahram material.
