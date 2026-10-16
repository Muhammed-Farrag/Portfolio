"""Hero photograph cut-out (content-source/portrait/README.md).

    tools/.venv/Scripts/python scripts/portrait-photo.py compare
        Segments the original with several rembg models and writes a side-by-side sheet of the
        head region to .review/portrait-masks.png for review.

    tools/.venv/Scripts/python scripts/portrait-photo.py export <model>
        Writes src/assets/portrait/photo.webp from the chosen mask ('union' combines all models).

The crop (738 px square at 18, 346) aligns the photograph with the particle portrait; it was
found by normalised cross-correlation (0.973) and must not change.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ORIGINAL = ROOT / 'content-source/portrait/originals/muhammed-farrag-original.jpg'
MASKS = ROOT / 'content-source/portrait/masks'
OUT = ROOT / 'src/assets/portrait/photo.webp'
REVIEW = ROOT / '.review'
CROP = (18, 346, 18 + 738, 346 + 738)
MODELS = ['isnet-general-use', 'u2net_human_seg', 'birefnet-portrait']
STORM = (35, 53, 77)


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


def export(choice: str) -> None:
    mask = union([segment(m) for m in MODELS]) if choice == 'union' else segment(choice)
    cutout(mask).save(OUT, quality=88, method=6)
    print(OUT, OUT.stat().st_size, 'bytes')


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] not in ('compare', 'export'):
        sys.exit(__doc__)
    compare() if sys.argv[1] == 'compare' else export(sys.argv[2])
