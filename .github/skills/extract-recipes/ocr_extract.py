"""
OCR image-based recipe PNGs using Tesseract.
Groups multi-page renders back into single text files.

Usage: py -3 ocr_extract.py <source_folder>
"""
import os
import re
import sys
import pytesseract
from PIL import Image

if len(sys.argv) < 2:
    print("Usage: py -3 ocr_extract.py <source_folder>")
    sys.exit(1)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

IMG_DIR = os.path.join(sys.argv[1], "extracted", "needs_ocr")
OUT_DIR = os.path.join(sys.argv[1], "extracted", "text")

os.makedirs(OUT_DIR, exist_ok=True)

# Group files by base name (strip _p1, _p2 suffixes)
files = sorted(f for f in os.listdir(IMG_DIR) if f.lower().endswith((".png", ".jpg", ".jpeg")))
groups = {}
for f in files:
    base = re.sub(r"_p\d+\.png$", "", f)
    base = re.sub(r"\.(png|jpg|jpeg)$", "", base)
    groups.setdefault(base, []).append(f)

total = len(groups)
done = 0

for base, pages in sorted(groups.items()):
    out_path = os.path.join(OUT_DIR, base + ".txt")
    if os.path.exists(out_path):
        done += 1
        continue  # Already extracted via text method

    text_parts = []
    for page_file in sorted(pages):
        img_path = os.path.join(IMG_DIR, page_file)
        img = Image.open(img_path)
        text = pytesseract.image_to_string(img, lang="eng+fra")
        text_parts.append(text)

    full_text = "\n\n".join(text_parts)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(full_text)

    done += 1
    if done % 10 == 0:
        print(f"  {done}/{total} done...")

print(f"OCR complete: {done}/{total} recipes -> {OUT_DIR}")
