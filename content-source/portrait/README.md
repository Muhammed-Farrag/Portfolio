# Hero photograph

Since 27 Oct 2026 the Hero uses **`originals/muhammed-farrag-avenue-regenerated.png`**, 1847×852,
a clean regeneration of the avenue photograph supplied by Muhammed, used as it is (no compositing,
no upscaling). Pillow (LANCZOS), WebP quality 92, `method=6`:

| File | Size | Use |
|---|---|---|
| `src/assets/hero/avenue-regen-1847.webp` | 1847×852 | Desktop, the source at full size (srcset) |
| `src/assets/hero/avenue-regen-1200.webp` | 1200×554 | Narrower desktops (srcset) |
| `src/assets/hero/avenue-regen-portrait.webp` | 767×852 | Phones: a crop at x=500, centred on him, the full height |

## Earlier: the first avenue photograph (v3, 26 Oct 2026)

**`originals/muhammed-farrag-avenue.jpg`**, 3834×1768, was the first v3 Hero. It is an upscaled, edited
image: soft at full size, with a smeared patch beside his head, so its WebP exports (`avenue-2400`,
`avenue-1200`, `avenue-portrait-900`) were removed on 27 Oct 2026; they remain in git history.

The sections below describe the earlier photographs and the particle hero (the `roualwaysright`
branch); their scripts and assets are kept for reference.

## Earlier: the Summer Palace photograph (particle hero)

The Hero shows **`originals/muhammed-farrag-summer-palace.jpg`**, supplied by Muhammed on 25 Oct 2026:
him at the Summer Palace in Beijing, 900×1600, untouched. Both layers of the Hero come from one
**900 px square at (0, 520)**, the photograph's full width from the mountains and the pagoda hill down to
the logo on his shirt, with Kunming Lake, the trees and the pavilions between. The background is kept on
purpose (the owner's choice): the view is part of the picture. Because the particles and the photograph
share the frame, the reveal lines up by construction.

Reproduce with `scripts/portrait-photo.py` from the project-local `tools/.venv` (`rembg[cpu]`, Pillow, numpy):

```
tools/.venv/Scripts/python.exe scripts/portrait-photo.py scene       # src/assets/portrait/photo.webp
tools/.venv/Scripts/python.exe scripts/portrait-photo.py particles   # src/assets/portrait/source-600.webp
node scripts/portrait-assets.mjs                                      # src/assets/portrait/fallback.webp (dev server up)
```

1. **`photo.webp`**: the frame as photographed, WebP quality 86 (90 KB). On desktop its left edge fades
   into the night sky beside the name (`Hero.css`).
2. **`source-600.webp`**: what the particle engine samples, 600×600, lossless. Only the person: cut out with
   `rembg` (`birefnet-portrait`, mask in `masks/summer-palace/`), his luminance with local contrast for the
   features, the face scaled to the earlier portrait's middle tones, the dim fabric of the black T-shirt
   thinned and lightly scattered, and a faint rim on the silhouette. He fills less of the frame than the
   earlier portrait did, so it has **5,198 / 2,320 / 1,307 points** at Ultra / Fine / Soft (earlier
   10,203 / 4,525 / 2,549).
3. **`fallback.webp`**: a paused frame of the engine on a transparent ground, so it sits on any palette.

The Contact section no longer shows the photograph (removed 25 Oct 2026 at the owner's request).

## Earlier photograph

`originals/muhammed-farrag-original.jpg` (14 Oct 2026, 1200×1600) was the Hero photograph until 25 Oct 2026,
and the legacy particle portrait (`legacy/particle-portrait/portrait.png`) was made from it. Its masks are
in `masks/`; `scripts/portrait-photo.py --source original` still reproduces its cut-out (738 px square at 18, 346,
aligned to the legacy portrait by normalised cross-correlation, 0.973).
