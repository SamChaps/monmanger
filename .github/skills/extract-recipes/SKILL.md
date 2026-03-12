---
name: extract-recipes
description: 'Extract text from recipe PDFs and images. Use when: batch-importing recipes from PDF/PNG/JPG files, OCR-ing scanned recipes, preparing raw text for the new-recipe skill.'
argument-hint: 'Path to folder containing recipe PDFs/images'
---

# Recipe Extraction Skill

## When to Use
- Extracting text from a folder of recipe PDFs, PNGs, or JPGs
- Batch-preparing raw text files for conversion to recipe markdown
- Re-running extraction on new files added to an existing folder

## Prerequisites

Python 3 with these packages (install if missing):

```
pip install pymupdf pytesseract Pillow
```

Tesseract OCR must be installed for image-based files:
- **Windows**: Install from <https://github.com/UB-Mannheim/tesseract/wiki>, default path `C:\Program Files\Tesseract-OCR\tesseract.exe`
- Add French language support: copy `fra.traineddata` into Tesseract's `tessdata` folder
- Verify: `tesseract --list-langs` should show `eng` and `fra`

## Scripts

Both scripts live in this skill directory and accept a source folder as a CLI argument:

- **`extract_text.py`** — Phase 1: text extraction + image rendering
- **`ocr_extract.py`** — Phase 2: Tesseract OCR on image files

## Workflow

### Phase 1 — Text Extraction + Image Rendering

Run `extract_text.py` with the source folder path:

```powershell
py -3 .github/skills/extract-recipes/extract_text.py "<SOURCE_FOLDER>"
```

This will:
1. Extract text from PDFs with selectable text (>50 chars) → `extracted/text/*.txt`
2. Render image-based PDFs to PNG at 200 dpi → `extracted/needs_ocr/*.png`
3. Copy PNG/JPG files to `extracted/needs_ocr/`

### Phase 2 — OCR Image Files

If Phase 1 produced files in `needs_ocr/`, run `ocr_extract.py`:

```powershell
py -3 .github/skills/extract-recipes/ocr_extract.py "<SOURCE_FOLDER>"
```

This will:
1. Group multi-page PNGs (e.g. `recipe_p1.png`, `recipe_p2.png`) back into one text file
2. Run Tesseract OCR with `eng+fra` language support
3. Skip files already extracted in Phase 1
4. Output `.txt` files to `extracted/text/`

OCR can be slow — run in a background terminal so other work can continue. Monitor progress:

```powershell
(Get-ChildItem "<SOURCE_FOLDER>\extracted\text" -Filter "*.txt").Count
```

## Output

All extracted text ends up in `<SOURCE_FOLDER>/extracted/text/` as `.txt` files — one per recipe, named after the original PDF/image filename.

These text files are ready to be converted to recipe markdown using the **new-recipe** skill.
