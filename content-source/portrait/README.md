# Hero photograph

`originals/muhammed-farrag-original.jpg` is the photograph supplied by Muhammed (14 Oct 2026), 1200×1600, untouched. It has no EXIF metadata. The particle portrait (`legacy/particle-portrait/portrait.png`) was made from this photograph.

`src/assets/portrait/photo.webp` is derived from it for the Hero's photograph reveal:

1. **Background removed** with `rembg`, model `birefnet-portrait` (16 Oct 2026). It is the only model compared (`isnet-general-use`, `u2net_human_seg`, a union of all three) that keeps his left ear whole. The masks are kept in `masks/`. Reproduce with `scripts/portrait-photo.py` (`compare`, then `export birefnet-portrait`) from a project-local `tools/.venv` with `rembg[cpu]` installed.
2. **Aligned to the particle portrait** by searching scale and offset for the best normalised cross-correlation between the photo's luminance and the portrait's (head and shoulders region, blurred): correlation 0.973 for a **738 px square crop at (18, 346)**. The crop is used at its native resolution, with no upscaling.
3. **Edges cleaned**: the matte is eroded by 1 px and lightly feathered, and semi-transparent edge pixels take the colour of the nearby subject, removing the pale fringe left by the sky.
4. Saved as WebP with alpha, quality 88 (35 KB).

The photo supports display at up to about 370 CSS px at 2x density. The Hero shows it at up to about 830 CSS px on large desktops, where it is slightly soft. A higher-resolution original would sharpen it; repeat the steps above with the new file.
