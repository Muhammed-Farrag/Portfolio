"""Hero photograph and particle source (content-source/portrait/README.md).

    tools/.venv/Scripts/python scripts/portrait-photo.py [--source NAME] compare
        Segments the original with several rembg models and writes a side-by-side sheet of the
        head region to .review/portrait-masks.png for review.

    tools/.venv/Scripts/python scripts/portrait-photo.py [--source NAME] scene
        Writes src/assets/portrait/photo.webp: the crop as photographed, background and all.

    tools/.venv/Scripts/python scripts/portrait-photo.py [--source NAME] export <model>
        Writes src/assets/portrait/photo.webp as a cut-out instead, from the chosen mask ('union'
        combines all models). The Hero used this until 25 Oct 2026.

    tools/.venv/Scripts/python scripts/portrait-photo.py [--source NAME] particles
        Writes src/assets/portrait/source-600.webp, the image the particle engine samples: only the
        person (cut out with the birefnet-portrait mask), in the same crop, so the photograph reveal
        lines up with the particles by construction.

Sources (default: summer-palace):
    original       14 Oct 2026. Its crop (738 px square at 18, 346) aligned the photograph with the
                   legacy particle portrait (normalised cross-correlation 0.973). Kept for reference.
    summer-palace  25 Oct 2026, the Summer Palace in Beijing: the current Hero photograph. Its crop
                   is the full width, 900 px square from y = 520: the mountains and the pagoda hill,
                   Kunming Lake, the trees and pavilions, and him down to the logo on his shirt.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCES = {
    'original': ('muhammed-farrag-original.jpg', 'masks', (18, 346, 18 + 738, 346 + 738)),
    'summer-palace': ('muhammed-farrag-summer-palace.jpg', 'masks/summer-palace', (0, 520, 900, 1420)),
}
_args = sys.argv[1:]
SOURCE = _args[_args.index('--source') + 1] if '--source' in _args else 'summer-palace'
if '--source' in _args:
    del _args[_args.index('--source'):_args.index('--source') + 2]
_file, _masks, CROP = SOURCES[SOURCE]
ORIGINAL = ROOT / 'content-source/portrait/originals' / _file
MASKS = ROOT / 'content-source/portrait' / _masks
OUT = ROOT / 'src/assets/portrait/photo.webp'
PARTICLES = ROOT / 'src/assets/portrait/source-600.webp'
REVIEW = ROOT / '.review'
MODELS = ['isnet-general-use', 'u2net_human_seg', 'birefnet-portrait']
STORM = (35, 53, 77)
# The particle engine discards pixels darker than this (DEFAULT_THRESHOLD in sampling.ts).
THRESHOLD = 33


def mask_path(model: str) -> Path:
    return MASKS / f'{model}.png'


def segment(model: str) -> Image.Image:
    path = mask_path(model)
    if path.exists():
        return Image.open(path).convert('L')
    from rembg import new_session, remove

    mask = remove(Image.open(ORIGINAL).convert('RGB'), session=new_session(model), only_mask=True, post_process_mask=False)
    MASKS.mkdir(parents=True, exist_ok=True)
    mask.save(path)
    return mask


def union(masks: list[Image.Image]) -> Image.Image:
    return Image.fromarray(np.max(np.stack([np.asarray(m) for m in masks]), axis=0))


def cutout(mask: Image.Image) -> Image.Image:
    """Crop, erode the matte by 1 px and take edge colours from the nearby subject (no pale fringe)."""
    rgb = Image.open(ORIGINAL).convert('RGB').crop(CROP)
    a = mask.crop(CROP)
    a2 = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    arr = np.asarray(rgb, dtype=np.float32)
    al = np.asarray(a2, dtype=np.float32) / 255
    core = np.asarray(a, dtype=np.float32) > 250
    src = Image.fromarray((arr * core[..., None]).astype(np.uint8))
    weight = Image.fromarray((core * 255).astype(np.uint8))
    blur = np.asarray(src.filter(ImageFilter.GaussianBlur(4)), dtype=np.float32)
    wb = np.asarray(weight.filter(ImageFilter.GaussianBlur(4)), dtype=np.float32) / 255
    fill = blur / np.maximum(wb[..., None], 1e-3)
    edge = (al > 0) & (al < 0.98)
    k = np.clip((1 - al) * 1.6, 0, 1)[..., None]
    out = np.where(edge[..., None], arr * (1 - k) + fill * k, arr)
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    img.putalpha(a2)
    return img


def on_storm(img: Image.Image) -> Image.Image:
    bg = Image.new('RGB', img.size, STORM)
    bg.paste(img, (0, 0), img)
    return bg


def compare() -> None:
    masks = {m: segment(m) for m in MODELS}
    masks['union'] = union(list(masks.values()))
    head = (150, 0, 600, 450)  # the head and both ears, inside the crop
    tiles = [on_storm(cutout(m)).crop(head).resize((360, 360)) for m in masks.values()]
    sheet = Image.new('RGB', (360 * len(tiles), 400), STORM)
    for i, tile in enumerate(tiles):
        sheet.paste(tile, (i * 360, 40))
    REVIEW.mkdir(exist_ok=True)
    sheet.save(REVIEW / 'portrait-masks.png')
    print('order:', ', '.join(masks))
    print('sheet:', REVIEW / 'portrait-masks.png')


def scene() -> None:
    """The photograph in the crop, background kept."""
    Image.open(ORIGINAL).convert('RGB').crop(CROP).save(OUT, quality=86, method=6)
    print(OUT, OUT.stat().st_size, 'bytes')


def particles() -> None:
    """The particle source: the cut-out's luminance on black, toned like the legacy portrait.

    The engine colours points by luminance only. The legacy source keeps the face in the middle
    tones (median 137) and lets the dark jacket fall mostly under THRESHOLD, so only its folds,
    edges and a scatter of points remain (11% of pixels survive). This does the same: local
    contrast for the features, the face scaled to that median, a sparse random scatter on the
    darkest fabric, and a faint rim along the silhouette so the shirt keeps its outline.
    """
    cut = cutout(segment('birefnet-portrait')).resize((600, 600), Image.LANCZOS)
    alpha = np.asarray(cut.getchannel('A'), dtype=np.float32) / 255
    lum = np.asarray(ImageOps.grayscale(cut.convert('RGB')), dtype=np.float32)
    blur = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(8)), dtype=np.float32)
    detail = lum + 1.2 * (lum - blur)
    inside = alpha > 0.5
    top = int(np.flatnonzero(inside.any(axis=1))[0])
    # The head and neck: about 204 px of the original photograph below the top of the hair.
    band = round(204 * 600 / (CROP[2] - CROP[0]))
    face = inside[top:top + band] & (lum[top:top + band] > 60)
    out = detail * 137 / np.median(detail[top:top + band][face])
    # The point budget: the legacy portrait has 10,203 points at Ultra. Thin the dim fabric tones and
    # keep only a light scatter on the darkest, so the source stays within it.
    rng = np.random.default_rng(7)
    dim = inside & (out >= THRESHOLD) & (out < THRESHOLD + 40)
    out = np.where(dim & (rng.random(out.shape) > 0.3), THRESHOLD - 8, out)
    dark = inside & (out < THRESHOLD)
    out = np.where(dark & (rng.random(out.shape) < 0.02 + out / THRESHOLD * 0.04), THRESHOLD + 14, out)
    rim = (alpha > 0.5) & ~np.asarray(Image.fromarray((inside * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(5)), dtype=bool)
    out = np.where(rim & (out < THRESHOLD + 30), THRESHOLD + 30, out)
    out = np.clip(out, 0, 255) * alpha
    # A warm white whose Rec. 709 luminance equals `out`, so THRESHOLD applies as computed above.
    tint = np.array([1.0, 0.93, 0.84], dtype=np.float32)
    rgb = np.clip(out[..., None] * tint / float(tint @ [0.2126, 0.7152, 0.0722]), 0, 255)
    Image.fromarray(rgb.astype(np.uint8)).save(PARTICLES, lossless=True, method=6)
    print(PARTICLES, PARTICLES.stat().st_size, 'bytes')


def export(choice: str) -> None:
    mask = union([segment(m) for m in MODELS]) if choice == 'union' else segment(choice)
    cutout(mask).save(OUT, quality=88, method=6)
    print(OUT, OUT.stat().st_size, 'bytes')


if __name__ == '__main__':
    commands = {'compare': compare, 'scene': scene, 'particles': particles, 'export': lambda: export(_args[1])}
    if not _args or _args[0] not in commands:
        sys.exit(__doc__)
    commands[_args[0]]()
