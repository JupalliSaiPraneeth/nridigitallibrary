import sys, pymupdf
sys.stdout.reconfigure(encoding='utf-8')

doc = pymupdf.open('backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf')
for p in range(6, 15):
    print(f"=== PAGE {p+1} ===")
    print(doc[p].get_text())
