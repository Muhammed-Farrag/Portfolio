# Certificates

`originals/` holds the 28 unique certificate PDFs from *My Own Certificates* (16 Oct 2026). These
PDFs are never published: the site ships only the WebP images rendered from them.

Duplicates were left out, each byte-identical to a file kept here:

| File in *My Own Certificates* | Same as |
|---|---|
| Algorithms on Graphs - Copy.pdf | Algorithms on Graphs.pdf |
| STC - Copy.pdf | STC.pdf |
| Mohamed Moustafa.pdf | STC.pdf |
| Course_Certificate_En.pdf | Mastering Object-Oriented Programming (OOP) using C++.pdf |

## Regenerate

From the repository root, with PyMuPDF and Pillow in the project-local `tools/.venv`:

```
tools/.venv/Scripts/python.exe scripts/certificates.py preview   # .review/certificates-sheet.png
tools/.venv/Scripts/python.exe scripts/certificates.py export    # src/assets/certificates/ + src/content/certificates.data.json
```

Title, issuer, platform and date are read from each PDF's text layer. Three certificates use
another layout and are entered in `OVERRIDES` in the script, from what is printed on them: JDBC
and the C++ course (Mahara-Tech, ITI) and the STC Data Analysis certificate (in Arabic).
