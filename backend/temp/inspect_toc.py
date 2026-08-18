import sys, pymupdf
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf')
print("Native TOC:", doc.get_toc())

print("\n--- Scanning Pages for chapter titles & headings ---")
for pno in range(len(doc)):
    page = doc[pno]
    text = page.get_text()
    for line in text.split("\n"):
        line_s = line.strip()
        if any(w in line_s.lower() for w in ["contents", "chapter", "solids", "solubility", "solutions", "dispersions", "surfaces", "polymers"]):
            if len(line_s) < 80 and not line_s.endswith("."):
                print(f"Page {pno+1}: {line_s}")
