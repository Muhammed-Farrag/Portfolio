# Certificates

`originals/` holds the 37 unique certificate PDFs from *My Own Certificates* (28 on 16 Oct 2026,
9 more on 25 Oct 2026). These PDFs are never published: the site ships only the WebP images
rendered from them.

Duplicates were left out, each byte-identical to a file kept here:

| File in *My Own Certificates* | Same as |
|---|---|
| Algorithms on Graphs - Copy.pdf | Algorithms on Graphs.pdf |
| STC - Copy.pdf | STC.pdf |
| Mohamed Moustafa.pdf | STC.pdf |
| Course_Certificate_En.pdf | Mastering Object-Oriented Programming (OOP) using C++.pdf |

Renamed on the way in:

| File in *My Own Certificates* | Kept as |
|---|---|
| 1788242794822.pdf | GCI World 2026.pdf |
| Building AI Agents  Fundamentals to Advanced.pdf (two spaces) | Building AI Agents Fundamentals to Advanced.pdf |

## Regenerate

From the repository root, with PyMuPDF and Pillow in the project-local `tools/.venv`:

```
tools/.venv/Scripts/python.exe scripts/certificates.py preview   # .review/certificates-sheet.png
tools/.venv/Scripts/python.exe scripts/certificates.py export    # src/assets/certificates/ + src/content/certificates.data.json
```

Title, issuer, platform and date are read from each PDF's text layer. Certificates in another
layout are entered in `OVERRIDES` in the script, from what is printed on them: JDBC and the C++
course (Mahara-Tech, ITI), the STC Data Analysis certificate (in Arabic), GCI World 2026 (The
University of Tokyo), and the three Coursera Specializations (Packt, EDUCBA, Pearson), whose
issuer appears only as a logo. The Building AI Agents title is also overridden, because its text
layer has a broken en dash.

After adding certificates, update the count in `tests/e2e/certificates.spec.ts` and the README.
