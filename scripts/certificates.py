"""Certificates: render page 1 of each certificate PDF to WebP for the gallery.

The PDFs stay in content-source/certificates/originals/ and are never published; the site only
ships the rendered images. Byte-identical duplicates are skipped (the first file name wins).

Usage (from the repository root, with tools/.venv):
    tools/.venv/Scripts/python.exe scripts/certificates.py preview   # contact sheet in .review/
    tools/.venv/Scripts/python.exe scripts/certificates.py export    # src/assets/certificates/*.webp
                                                                     # + src/content/certificates.data.json
"""

import hashlib
import json
import re
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / 'content-source' / 'certificates' / 'originals'
ASSETS = ROOT / 'src' / 'assets' / 'certificates'
DATA = ROOT / 'src' / 'content' / 'certificates.data.json'
REVIEW = ROOT / '.review'

# Image widths: a card in the moving gallery, and the lightbox.
CARD_W = 560
FULL_W = 1400

MONTHS = {m: i + 1 for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])}

# Certificates whose text layer does not follow the Coursera layout: read off the certificate itself.
OVERRIDES = {
    'JDBC': {'title': 'Java Database Connectivity (JDBC)', 'issuer': 'Mahara-Tech · ITI', 'platform': 'Mahara-Tech', 'date': '2024-08', 'kind': 'course'},
    'Mastering Object-Oriented Programming (OOP) using C++': {'issuer': 'Mahara-Tech · ITI', 'platform': 'Mahara-Tech', 'date': '2024-06', 'kind': 'course'},
    # Arabic certificate of completion, "Data Analysis" (تحليل البيانات), dated 2024-08-09.
    'STC': {'title': 'Data Analysis', 'issuer': 'STC', 'platform': 'STC', 'date': '2024-08', 'kind': 'course'},
}


def details(pdf: Path) -> dict:
    """Title, issuer, date (YYYY-MM) and kind, from the certificate's own text."""
    flat = ' '.join(text_of(pdf).split())
    info = {'title': pdf.stem, 'issuer': None, 'platform': None, 'date': None, 'kind': 'course'}
    m = re.search(r'Mohamed Mustafa Mohamed (.+?) an online non-credit (course|project) authorized by (.+?) and offered through (\w+)', flat)
    if m:
        info.update(title=m.group(1), kind=m.group(2), issuer=m.group(3), platform=m.group(4))
    # Dates are letter-spaced in some text layers: "A pr 12, 2025", "Dec 8 , 2022".
    d = re.search(r'([A-Z]) ?([a-z]) ?([a-z]) (\d{1,2}) ?, (\d{4})', flat)
    if d and ''.join(d.group(1, 2, 3)) in MONTHS:
        info['date'] = f'{d.group(5)}-{MONTHS["".join(d.group(1, 2, 3))]:02d}'
    info.update(OVERRIDES.get(pdf.stem, {}))
    return info


def unique_pdfs():
    seen = {}
    for pdf in sorted(ORIGINALS.glob('*.pdf'), key=lambda p: (' - Copy' in p.stem, p.name.lower())):
        digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
        if digest in seen:
            print(f'skip duplicate: {pdf.name} (same as {seen[digest].name})')
            continue
        seen[digest] = pdf
    return list(seen.values())


def render(pdf: Path, width: int) -> Image.Image:
    with pymupdf.open(pdf) as doc:
        page = doc[0]
        zoom = width / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)


def text_of(pdf: Path) -> str:
    with pymupdf.open(pdf) as doc:
        return doc[0].get_text()


def slug(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def preview():
    pdfs = unique_pdfs()
    thumbs = [(p.stem, render(p, 360)) for p in pdfs]
    cols = 6
    w = 360
    h = max(im.height for _, im in thumbs) + 30
    rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w, rows * h), (30, 30, 30))
    for i, (name, im) in enumerate(thumbs):
        x, y = (i % cols) * w, (i // cols) * h
        sheet.paste(im, (x, y + 30))
        ImageDraw.Draw(sheet).text((x + 4, y + 8), name[:52], fill=(255, 255, 255))
    out = REVIEW / 'certificates-sheet.png'
    sheet.save(out)
    print(out, len(thumbs), 'certificates')
    for p in pdfs:
        print(' ', p.stem, '|', details(p))


def export():
    ASSETS.mkdir(parents=True, exist_ok=True)
    items = []
    for pdf in unique_pdfs():
        s = slug(pdf.stem)
        full = render(pdf, FULL_W)
        full.save(ASSETS / f'{s}.webp', quality=82, method=6)
        card = full.resize((CARD_W, round(full.height * CARD_W / full.width)), Image.LANCZOS)
        card.save(ASSETS / f'{s}.card.webp', quality=80, method=6)
        info = details(pdf)
        items.append({'id': s, 'file': pdf.name, 'width': full.width, 'height': full.height, **info})
        print(f'{s}: {full.width}x{full.height} {info}')
    items.sort(key=lambda i: i['date'] or '', reverse=True)
    DATA.write_text(json.dumps(items, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(DATA, len(items))


if __name__ == '__main__':
    {'preview': preview, 'export': export}[sys.argv[1] if len(sys.argv) > 1 else 'preview']()
