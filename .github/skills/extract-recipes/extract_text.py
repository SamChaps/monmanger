"""Extract text from recipe PDFs and images.
- Text-based PDFs: extract directly with pymupdf
- Image-based PDFs: render to PNG for later OCR
- PNG/JPG images: copy as-is for later OCR

Usage: py -3 extract_text.py <source_folder>
"""
import fitz
import os
import shutil
import sys

if len(sys.argv) < 2:
    print("Usage: py -3 extract_text.py <source_folder>")
    sys.exit(1)

SRC = sys.argv[1]
OUT_TEXT = os.path.join(SRC, "extracted", "text")
OUT_IMG = os.path.join(SRC, "extracted", "needs_ocr")

os.makedirs(OUT_TEXT, exist_ok=True)
os.makedirs(OUT_IMG, exist_ok=True)

text_count = 0
img_count = 0

# Process PDFs
for f in sorted(os.listdir(SRC)):
    path = os.path.join(SRC, f)
    base = os.path.splitext(f)[0]

    if f.lower().endswith(".pdf"):
        doc = fitz.open(path)
        text = "".join(page.get_text() for page in doc)

        if len(text.strip()) > 50:
            # Text-extractable PDF
            out_path = os.path.join(OUT_TEXT, base + ".txt")
            with open(out_path, "w", encoding="utf-8") as fh:
                fh.write(text)
            text_count += 1
        else:
            # Image-based PDF — render each page as PNG
            for i, page in enumerate(doc):
                pix = page.get_pixmap(dpi=200)
                suffix = f"_p{i+1}" if len(doc) > 1 else ""
                img_path = os.path.join(OUT_IMG, base + suffix + ".png")
                pix.save(img_path)
            img_count += 1

        doc.close()

    elif f.lower().endswith((".png", ".jpg", ".jpeg")):
        # Copy image files directly
        shutil.copy2(path, os.path.join(OUT_IMG, f))
        img_count += 1

print(f"Text extracted: {text_count} files -> {OUT_TEXT}")
print(f"Needs OCR: {img_count} files -> {OUT_IMG}")
print("Done!")
