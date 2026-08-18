import sys, os, json, uuid
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')

from backend.database import SessionLocal, Book, Author, Chapter, BookKeyword
from backend.pipeline.extractor import PDFExtractor
from backend.pipeline.structure_parser import StructureParser
from backend.pipeline.metadata_engine import MetadataEngine

db = SessionLocal()

# Find Book ID 14 (Physical Pharmacy) or books that need reprocessing
books = db.query(Book).all()
print(f"Total books in DB: {len(books)}")

for book in books:
    if "Physical" in book.title or (book.pdf_path and "Physical" in book.pdf_path):
        print(f"\n--- Reprocessing Book ID {book.id}: {book.title} ---")
        rel_pdf = book.pdf_path.lstrip("/")
        abs_pdf = os.path.join("backend", rel_pdf)
        if not os.path.exists(abs_pdf):
            abs_pdf = os.path.join("backend", "storage", "pdfs", os.path.basename(book.pdf_path))
        
        print("PDF path:", abs_pdf)
        if not os.path.exists(abs_pdf):
            print("PDF not found on disk, skipping.")
            continue

        images_dir = os.path.join("backend", "storage", "images")
        dest_prefix = f"b{book.id}_{uuid.uuid4().hex[:6]}"
        
        extractor = PDFExtractor(
            abs_pdf,
            images_output_dir=images_dir,
            image_url_prefix="/storage/images",
            image_prefix=dest_prefix
        )
        pages = extractor.extract_all_pages()
        print(f"Extracted {len(pages)} pages with {extractor.extracted_images_count} figures/images.")

        meta_engine = MetadataEngine(pages, os.path.basename(abs_pdf))
        meta = meta_engine.extract_metadata()

        parser = StructureParser(extractor.doc, pages)
        chapters_data = parser.extract_chapters()
        print(f"Segmented {len(chapters_data)} chapters.")

        # Update book
        book.title = meta["title"]
        book.publisher = meta["publisher"] or "RPS Publishing"
        book.isbn = meta["isbn"] or "978-0-85369-725-1"
        book.publication_year = meta["publication_year"] or "2008"
        book.department = "PHARM"
        book.category = "Pharmaceutical Sciences"
        book.extraction_confidence = extractor.overall_confidence
        book.total_pages = len(pages)
        book.processing_status = "PUBLISHED"

        # Clear existing chapters and re-add
        db.query(Chapter).filter(Chapter.book_id == book.id).delete()
        db.flush()

        for ch in chapters_data:
            db.add(Chapter(
                book_id=book.id,
                chapter_number=ch["chapter_number"],
                title=ch["title"],
                description=ch.get("description"),
                start_page=ch["start_page"],
                end_page=ch["end_page"],
                content=ch["content"],
                formatted_html=ch["formatted_html"]
            ))

        db.commit()
        db.refresh(book)
        extractor.close()
        print(f"[SUCCESS] Book ID {book.id} updated with {len(chapters_data)} chapters and {extractor.extracted_images_count} figures!")

db.close()
