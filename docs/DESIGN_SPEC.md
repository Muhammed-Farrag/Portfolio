# Design Specification

**Revision 2 (14 Oct 2026), approved 14 Oct 2026.** It replaces the Obsidian & Amber palette with the owner's botanical palette, adds a React Bits component plan, and adds the recognition asset and placeholder system. The architecture, scene structure, factual-content safeguards and the Particle Portrait engine are unchanged from the approved revision.

**Internal codename:** THE ARCHITECT. The codename never appears in public copy, metadata, URLs or alt text. The public title is **Applied AI Engineer** unless the owner verifies a different one.

## 1. Principles

- The Particle Portrait is the primary visual centerpiece. No other effect competes with it.
- Every public claim maps to `CONTENT_APPROVAL.md` with status `verified` or `cv-reported`. Pending claims and placeholders never ship in a release build.
- All content is HTML text. WebGL, motion and interactions are progressive enhancements.
- Motion communicates data becoming form, flow through a system, or order in time. Nothing else moves.
- Native scroll. No cursor followers outside a scoped project demo, no autoplay audio, and the camera is never used.
- **No gold, amber, yellow or cyan anywhere in the public site.**

## 2. Color

### 2.1 Brand palette (owner-specified)

| Name | Hex | Role |
|---|---|---|
| Deep Ivy | `#1D2B1E` | Primary background, canvas clear color |
| Moss Haven | `#2F4A2E` | Elevated surfaces and cards |
| Soft Fern | `#6A7F61` | Supporting accents: rules, diagram edges, the portrait's shadow tone |
| Shadowed Plum | `#3A2A35` | Secondary surfaces: recognition chapters, placeholders, code |
| Dusky Rose | `#5B3A4A` | Interactive highlight fills: hover and selected states |
| Crimson Leaf | `#7A0F1F` | Selective focal accents: primary CTA fill, recognition nodes, active diagram step |

### 2.2 Derived supporting tones

These are needed because none of the six brand colors reaches 4.5:1 for text on the dark grounds. Each is a lightened tint of a brand hue, so it introduces no new hue.

| Token | Hex | Derived from | Use |
|---|---|---|---|
| Linen | `#F1EEE6` | neutral | Primary text, text on Crimson or Rose fills |
| Lichen | `#C9D3C1` | Soft Fern tint | Secondary text |
| Sage | `#AEBBA5` | Soft Fern tint | Captions, mono labels |
| Rose Mist | `#E3B9C8` | Dusky Rose tint | Link text, focus ring, live diagram path, recognition thread |
| Rule | `#4A5E48` | Moss and Fern | Decorative hairlines only |
| Fern Edge | `#93A589` | Soft Fern tint | Interactive outlines (WCAG 1.4.11) |

### 2.3 Contrast (WCAG 2.2, computed)

| Foreground | on Ivy | on Moss | on Plum | on Rose | on Crimson | Allowed as |
|---|---|---|---|---|---|---|
| Linen `#F1EEE6` | 12.79 | 8.46 | 11.59 | 8.43 | 9.46 | All text |
| Lichen `#C9D3C1` | 9.58 | 6.34 | 8.69 | 6.32 | 7.08 | All text |
| Sage `#AEBBA5` | 7.38 | 4.88 | 6.69 | 4.86 | 5.46 | All text, including small mono |
| Rose Mist `#E3B9C8` | 8.50 | 5.63 | 7.71 | 5.60 | 6.29 | Links, focus, thin lines |
| Fern Edge `#93A589` | 5.64 | 3.73 | 5.11 | 3.72 | — | Control outlines; text on Ivy only |
| Soft Fern `#6A7F61` | 3.40 | 2.25 | 3.09 | 2.24 | 2.52 | Non-text on Ivy and Plum, large text on Ivy only, **never body text** |
| Dusky Rose, Crimson, Moss, Plum | ≤ 1.52 | — | — | — | — | Fills only, **never text or thin lines** |

### 2.4 Semantic tokens

```css
--color-bg: #1D2B1E;            --color-surface: #2F4A2E;      --color-surface-alt: #3A2A35;
--color-text: #F1EEE6;          --color-text-secondary: #C9D3C1; --color-text-tertiary: #AEBBA5;
--color-link: #E3B9C8;          --color-focus: #E3B9C8;        --color-rule: #4A5E48;
--color-control-edge: #93A589;  --color-accent-support: #6A7F61;
--color-interactive-fill: #5B3A4A;  --color-focal: #7A0F1F;   --color-on-focal: #F1EEE6;
```

A unit test parses `tokens.css` and fails if any text/background pair in the allowed list drops below its WCAG threshold.

## 3. Particle Portrait color adaptation

The engine, sampling, physics, pointer interaction, scatter/reform and controls are unchanged. The only changes are:

1. **Clear color as a setting** (already planned for Phase 1). The site uses Deep Ivy.
2. **One new tone branch in the vertex shader's existing color block.** It adds three color uniforms; the position and physics code is untouched. The point's luminance (already computed as `lum`) maps along a ramp from Soft Fern (shadows) to Linen (highlights). Source pixels with a strongly red hue, the tie in the portrait, map to a Crimson Leaf → Rose Mist ramp as the one focal accent. The red-hue test runs on the existing `aColor` attribute.
3. The original tones (amber from the image, warm ivory, terminal green) remain in the shader for parity testing, but the public site never offers them. The site's controls drawer offers Botanical and Linen (monochrome) tones only.
4. The **static fallback image** and the **Source** view must not show the amber PNG. A paused frame from the engine itself is captured at build time as a botanical WebP fallback.
5. **Portrait Lab (decided):** the original amber prototype is kept for regression testing only. `legacy/particle-portrait/` is the untouched reference, and `dev/lab/` is its interface running on the maintained engine. Both are development and test pages. They are never production routes, are noindex, and are not linked from the site. The production build (Phase 2) must not include anything under `dev/` or `legacy/`.

Phase 3 A/B tests the ramp endpoints and the tie accent against the real portrait. The owner approves the result.

## 4. Typography and layout

Unchanged. Archivo (display, width 125%, uppercase for the name and section titles), Geist (body), JetBrains Mono (labels and readouts). A 12/8/4 column grid with a gutter of at least 16 px. Tested at 390, 768, 1280 and 1440 px.

## 5. Scenes and color roles

| # | Scene | Color treatment | Motion |
|---|---|---|---|
| 01 | Arrival: the hero and Particle Portrait | Ivy ground, botanical portrait, Linen name, Lichen specialisms. Primary CTA is a Crimson fill with Linen text; secondary CTAs have Fern Edge outlines. | Reform intro from the original scatter curve, scroll-driven `uBurst` on exit, render loop stops off-screen. Headline masked reveal. |
| 02 | How he thinks: system constellation | Route in Soft Fern, the travelling pulse in Rose Mist, nodes outlined in Fern Edge, Crimson for the focused node | The route draws once with one pulse |
| 03 | Selected work | Moss case panels; the NovaCare attribution map shows your modules in Rose Mist and teammates' in Sage | Sticky visuals, hover preview swap, HELIOS gesture console |
| 04 | Under the hood: Self-Healing | Plum diagram panel, Fern edges, the active step as a Crimson fill with a Rose Mist path | Pinned scroll steps, inject-a-failure simulation |
| 05 | Beyond the Code: recognition | Plum chapters on Ivy, a Rose Mist thread, Crimson nodes, photographs with an Ivy/Rose duotone grade at rest | Pinned horizontal track on desktop; the grade lifts and a halftone-dot reveal plays when a chapter is active |
| 06 | Experience and evolution | Gantt bars in Moss, the current role in Crimson, pending roles dashed in Fern Edge | Bars grow once along the time axis |
| 07 | Contact and footer | Real photograph with a subtle Ivy grade, the CTA headline in Linen with "useful" in Rose Mist, the footer on Plum | Hover states only |

## 6. Project interactions

### 6.1 HELIOS: gesture console

Controls for **Point to aim**, **Pinch to fire** and **Fist to reload** (buttons, plus keys A / F / R). A 10-round gauge, about a 1 s reload hold, and a 1 s combo window, all from the README. A scoped reticle follows the pointer inside the panel only, and is hidden on touch and under reduced motion. Label: "Simulation of the game's gesture logic. No camera is used on this page." The live demo link goes to `helios-rouge.vercel.app` with a camera notice.

### 6.2 Self-Healing: inject a failure

The visitor picks one of the five real failure classes, and an episode moves through the nine pipeline steps. A confidence control shows the governed branch, auto-patch or human review queue, as an **illustrative workflow with no numeric threshold presented as fact**. Code tracing (see `SOURCE_AUDIT.md`) shows that the enforced rule is "the model flags plans for review, and anything below 0.5 is always flagged". The dashboard's settings values are not used by the pipeline. Numbers appear only after Muhammed confirms them. Label: "Simulation in your browser. No backend and no model calls."

## 7. Beyond the Code

Three connected stories with factual chronology from the CV: **competitor (Aug 2025) → honoree (Apr 2026) → judge (Jul 2026)**. A fourth, Al-Ahram press, is pending verification and never renders in release until it is verified.

- **Desktop:** a pinned horizontal track. One Rose Mist thread runs through Crimson nodes. Each chapter has a photograph, a role word in display type, a mono date and place stamp, a short factual story, and evidence chips such as "Source: CV" and "Photo: supplied by Muhammed".
- **Mobile:** stacked vertically, with the thread running down the left edge and nothing pinned.
- **Photographs:** an editorial crop at a fixed aspect ratio. At rest they show a duotone grade of Ivy shadows and Linen highlights. When a chapter becomes active, a halftone-dot reveal (a visual echo of the particle portrait) lifts it to full color. There is no Ken Burns pan.
- **Asset system:** `content-source/recognition/<nn-story>/originals/` plus `manifest.json`, which records the claim, status, sources, slots, alt text, credit, consent and focal point. The build generates AVIF/WebP at 480, 960 and 1440 px and strips all metadata, including GPS.
- **Placeholders:** a slot whose file is null renders a Plum frame at the slot's final aspect ratio (so nothing shifts when the photo arrives), with a dashed Fern Edge border and a mono label stating exactly what is missing. Placeholders appear in development and preview builds only. **Production never shows a placeholder:** a story whose required image is missing is shown in its text-only layout when its claim is approved, an optional slot without a file is omitted, and a story whose claim is unverified is not rendered. A missing optional asset never blocks deployment. The release check fails only if a placeholder or an unapproved claim or image would actually render.
- **No fabricated images:** no generated, composited or stock images, and no claims taken from photographs or certificates unless they are approved in the register.

## 8. React Bits

The React Bits MCP is not connected to this Claude Code session. The components below were evaluated from the public source (`DavidHDev/react-bits`, MIT + Commons Clause, which allows use inside a website but not redistribution of the components themselves). React Bits components are copied in as source, so each one is re-tokenized, given a reduced-motion guard where it lacks one, and audited for accessibility before use. The project's motion library stays **GSAP** (already planned), so components that depend on `motion` are excluded.

| Need | Use | Dependencies | Notes |
|---|---|---|---|
| Text reveal | **MaskedHeading** for section titles; **SplitText** for the hero name only | gsap (+ SplitText plugin) | MaskedHeading already handles reduced motion. SplitText needs a guard, and a test that the heading's accessible name is still the whole string. |
| Section transitions | **AnimatedContent** (one shared preset, about 16 px rise and fade, once) | gsap, ScrollTrigger | Needs a reduced-motion guard. Content must be visible without JS; no `opacity:0` in CSS. |
| Interactive project previews | **PixelTransition** (screenshot ↔ architecture diagram on hover or focus) | none | Keyboard focus must trigger it. Tested for reduced motion. |
| Subtle hover | **SpotlightCard** on case panels, with a Rose Mist spotlight at low opacity | none | Disabled on touch. |
| Recognition interactions | **HalftoneReveal** for the photo grade lift; **GradualBlur** for the track edges | none | HalftoneReveal echoes the particle dots. Used on at most 3 images. |

**Not used:** all Backgrounds (they would compete with the portrait; *Particles* in particular must never stand in for the original renderer), cursor effects (TargetCursor, SplashCursor, BlobCursor), CountUp and Counter (no count-ups), DecryptedText, ScrambledText and GlitchText (unreadable to screen readers and visually clichéd), TiltedCard and BlurText (depend on `motion`), ScrollStack (fights native scroll), and Stepper and AnimatedList (pull in an icon library). The total budget for React Bits code is ≤ 25 KB gzip, and it is loaded after the hero.

## 9. Budgets

Initial JS ≤ 120 KB gzip before GSAP and React Bits. LCP ≤ 2.5 s (mobile simulation). CLS ≤ 0.05. Zero rAF callbacks while the hero is off-screen. axe reports zero serious or critical issues, and Lighthouse a11y is at least 95. The reduced-motion, no-WebGL and no-JS experiences are complete.

## 10. Open decisions

1. ~~Approve revision 2~~ approved 14 Oct 2026.
2. ~~`/lab`~~ decided: development and test only (§3.5).
3. Self-Healing threshold values: the simulation is illustrative until confirmed (§6.2).
4. Fourth featured case (recommendation: Advanced LangChain as a course lab).
5. Higher-resolution originals of the two supplied photos, plus the judge photos and the Al-Ahram material.
