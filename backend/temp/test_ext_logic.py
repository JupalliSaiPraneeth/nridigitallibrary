import sys, os, re, pymupdf, html
sys.stdout.reconfigure(encoding='utf-8')

CAPTION_REGEX = re.compile(
    r"^\s*(?:Figure|Fig\.?|Diagram|Schematic|Chart|Plot|Illustration)\s*[-–—:.]*\s*([0-9A-Za-z\.]+)(?:[\s:.\-–—]+(.*))?",
    re.IGNORECASE
)

def normalize_pdf_text(t: str) -> str:
    if not t:
        return ""
    # Map ligatures
    t = t.replace("\ufb00", "ff")
    t = t.replace("\ufb01", "fi")
    t = t.replace("\ufb02", "fl")
    t = t.replace("\ufb03", "ffi")
    t = t.replace("\ufb04", "ffl")
    # Clean control characters (preserve \n, \t)
    t = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", t)
    # Fix broken spaced words with ligatures like "in fl uence" -> "influence"
    t = re.sub(r"\b([a-zA-Z]+)\s+(fl|fi|ff)\s+([a-zA-Z]+)\b", r"\1\2\3", t)
    return t

doc = pymupdf.open('backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf')
print("Testing pages 5 and 13...")

# Test Page 5
p5 = doc[4]
blocks5 = p5.get_text("blocks")
drawings5 = p5.get_drawings()
print("P5 Drawings:", len(drawings5))
for d in drawings5:
    r = d["rect"]
    print("  Draw rect:", r, "items:", len(d["items"]))
    # Check if inside/adjacent to any block
    for b_idx, b in enumerate(blocks5):
        if b[6] == 0:
            b_rect = pymupdf.Rect(b[:4])
            if abs(r.y0 - b_rect.y0) < 15 or b_rect.contains(r) or (r.y0 >= b_rect.y0 - 5 and r.y1 <= b_rect.y1 + 5):
                print(f"  -> Found inline logo next to block {b_idx}: {repr(b[4][:40])}")

# Test Page 13
p13 = doc[12]
raw_blocks13 = p13.get_text("blocks")
cap_blocks13 = []
for b_idx, b in enumerate(raw_blocks13):
    if b[6] == 0:
        b_text = normalize_pdf_text(b[4]).strip()
        if b_text:
            first_l = b_text.split("\n")[0].strip()
            if CAPTION_REGEX.match(first_l):
                cap_blocks13.append((b_idx, b, first_l, b_text.replace("\n", " ")))

print("\nCap blocks on P13:", len(cap_blocks13))
for cb in cap_blocks13:
    print(" ", cb[0], cb[2])
