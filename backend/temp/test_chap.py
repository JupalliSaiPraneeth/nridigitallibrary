import sys
import pymupdf
sys.stdout.reconfigure(encoding='utf-8')

from backend.pipeline.extractor import PDFExtractor
from backend.pipeline.structure_parser import StructureParser

ext = PDFExtractor('backend/storage/pdfs/bad23b4c76_Physical Pharmacy - ajprd.pdf', images_output_dir='backend/temp/test_extract')
pages = ext.extract_all_pages()
parser = StructureParser(ext.doc, pages)
chapters = parser.extract_chapters()

print(f"Extracted {len(chapters)} chapters:")
for ch in chapters:
    print(f"Ch {ch['chapter_number']}: '{ch['title']}' (p.{ch['start_page']}-{ch['end_page']}) imgs={len(ch.get('images', []))}")
