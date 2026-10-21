"""Density maps the Important Events dots gather into (src/features/recognition/halftone.ts).

    tools/.venv/bin/python scripts/recognition-silhouettes.py

For each event photograph in src/assets/recognition/ this writes <name>.mask.webp next to it: a
small greyscale map, the same shape as the photograph as displayed, where brighter means more dots.
The two portraits use the person's cut-out (rembg, model birefnet-portrait, as the hero photograph
in scripts/portrait-photo.py); the newspaper clipping uses its ink, so the dots set its headline and
picture. A review sheet goes to .review/recognition-masks.png.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'src/assets/recognition'
REVIEW = ROOT / '.review'
MODEL = 'birefnet-portrait'
WIDTH = 96  # mask pixels across; the runtime samples a few thousand points from it

PHOTOS = {
    'roborave-beijing-2025': 'person',
    'depi-2026': 'person',
    'al-ahram-2026-09-07': 'ink',
}


def person(img: Image.Image) -> Image.Image:
    from rembg import new_session, remove

    return remove(img, session=new_session(MODEL), only_mask=True, post_process_mask=True)


def ink(img: Image.Image) -> Image.Image:
    """Darker ink, more dots; the paper itself keeps a faint floor so the sheet still reads."""
    grey = np.asarray(ImageOps.autocontrast(img.convert('L'), cutoff=2), dtype=np.float32) / 255
    return Image.fromarray((np.clip(0.05 + 0.95 * (1 - grey) ** 1.5, 0, 1) * 255).astype(np.uint8))


def main() -> None:
    tiles = []
    for name, kind in PHOTOS.items():
        img = Image.open(ASSETS / f'{name}.webp').convert('RGB')
        mask = person(img) if kind == 'person' else ink(img)
        h = round(WIDTH * img.height / img.width)
        small = mask.filter(ImageFilter.GaussianBlur(1.5)).resize((WIDTH, h), Image.LANCZOS)
        out = ASSETS / f'{name}.mask.webp'
        small.save(out, lossless=True, method=6)
        print(out.relative_to(ROOT), small.size, out.stat().st_size, 'bytes')
        tiles.append((img.resize((240, round(240 * img.height / img.width))), small.resize((240, round(240 * h / WIDTH)), Image.NEAREST)))
    sheet = Image.new('RGB', (480, sum(max(a.height, b.height) for a, b in tiles)), (35, 53, 77))
    y = 0
    for a, b in tiles:
        sheet.paste(a, (0, y))
        sheet.paste(b.convert('RGB'), (240, y))
        y += max(a.height, b.height)
    REVIEW.mkdir(exist_ok=True)
    sheet.save(REVIEW / 'recognition-masks.png')
    print('sheet:', REVIEW / 'recognition-masks.png')


if __name__ == '__main__':
    main()
