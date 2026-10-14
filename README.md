# Muhammed Farrag — Portfolio

Personal portfolio for Muhammed Farrag, Applied AI Engineer. The hero is built on his original Particle Portrait WebGL renderer.

The work is done in phases, and each phase needs the owner's approval. See `docs/DESIGN_SPEC.md`, `docs/SOURCE_AUDIT.md` and `docs/CONTENT_APPROVAL.md`.

## Layout

- `legacy/particle-portrait/`: the original prototype, imported from `D:\particle-portrait`. Patches are listed in its `PATCHES.md`.
- `src/features/particle-portrait/`: the renderer as a framework-independent TypeScript module.
- `lab/`: the Portrait Lab, the original experiment rebuilt on the module.
- `tests/`: unit tests (Vitest) and browser tests (Playwright).
- `content-source/`: original media supplied by the owner. Not served directly.
