import sys, os, re, pymupdf
sys.stdout.reconfigure(encoding='utf-8')

from backend.pipeline.extractor import PDFExtractor

doc = pymupdf.open('backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf')
print("Total pages:", len(doc))

# Scan each page for chapter starters
chapter_candidates = []
UNIT_REGEX = re.compile(r"^\s*(?:chapter|unit|module|part)\s*([0-9IVXLCDM]+)(?:[\s:.\-–—]+(.*))?$", re.IGNORECASE)

for pno in range(len(doc)):
    page = doc[pno]
    blocks = page.get_text("blocks")
    for b_idx, b in enumerate(blocks):
        if b[6] == 0:
            lines = [l.strip() for l in b[4].split("\n") if l.strip()]
            for l_idx, line in enumerate(lines):
                m = UNIT_REGEX.match(line)
                if m:
                    c_num = m.group(1)
                    c_title = m.group(2) or ""
                    if not c_title and l_idx + 1 < len(lines):
                        c_title = lines[l_idx + 1]
                    if not c_title and b_idx + 1 < len(blocks):
                        c_title = blocks[b_idx + 1][4].split("\n")[0]
                    # Check if this looks like an answers page (e.g. "1. a", "1. b")
                    is_answer = bool(re.search(r"^\s*[0-9]+\.\s+[a-z]", c_title, re.I))
                    chapter_candidates.append({
                        "page": pno + 1,
                        "num": c_num,
                        "title": c_title.strip(),
                        "is_answer": is_answer,
                        "raw": line
                    })

print(f"Found {len(chapter_candidates)} chapter candidates:")
for c in chapter_candidates:
    print(f"  Page {c['page']}: {c['raw']} | Title: {repr(c['title'])} | is_answer: {c['is_answer']}")
