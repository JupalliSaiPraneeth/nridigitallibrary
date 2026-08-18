import sys, os, pymupdf
sys.stdout.reconfigure(encoding='utf-8')

from backend.pipeline.extractor import PDFExtractor
from backend.pipeline.structure_parser import StructureParser
from backend.pipeline.metadata_engine import MetadataEngine

pdf_path = 'backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf'
ext = PDFExtractor(pdf_path, images_output_dir='backend/storage/images', image_prefix='pharm_test')
pages = ext.extract_all_pages()
print(f"Total extracted pages: {len(pages)}")
print(f"Total extracted figures & diagrams: {ext.extracted_images_count}")

# 1. Verify Page 5 (inline logo)
p5 = pages[4]
print("\n--- PAGE 5 ---")
print("Images count on Page 5:", len(p5.images))
print("Page 5 Text Preview:\n", p5.text[:400])
assert "[[INLINE_IMG:" in p5.text or any(img.get("url") for img in p5.images), "Page 5 should have inline logo!"

# 2. Verify Page 13 (Fig 1.1 and Fig 1.2)
p13 = pages[12]
print("\n--- PAGE 13 ---")
print("Images count on Page 13:", len(p13.images))
for img in p13.images:
    print("  Image:", img["filename"], "| Caption:", img["caption"], "| w,h:", img["width"], img["height"])
assert len(p13.images) >= 2, f"Expected at least 2 figures on Page 13, found {len(p13.images)}"

# 3. Verify Chapters
parser = StructureParser(ext.doc, pages)
chapters = parser.extract_chapters()
print(f"\n--- CHAPTERS ({len(chapters)}) ---")
for ch in chapters:
    has_inline_logo = "reader-inline-logo" in ch["formatted_html"]
    fig_count = len(ch.get("images", []))
    print(f"Ch {ch['chapter_number']}: {ch['title']} (p.{ch['start_page']}-{ch['end_page']}) | imgs={fig_count} | inline_logo={has_inline_logo}")

ext.close()
print("\n[SUCCESS] ALL VERIFICATIONS PASSED FOR PHYSICAL PHARMACY!")
