import sys
sys.path.insert(0, '.')
from backend.database import SessionLocal, Book

db = SessionLocal()
b = db.query(Book).filter(Book.id == 14).first()
print(f"Book: ID {b.id}, Title: '{b.title}', Dept: {b.department}, Status: {b.processing_status}")
print(f"Total Chapters: {len(b.chapters)}")

for ch in b.chapters:
    has_inline = "reader-inline-logo" in (ch.formatted_html or "")
    fig_count = (ch.formatted_html or "").count("reader-figure-card")
    print(f"  Ch {ch.chapter_number}: '{ch.title}' (p.{ch.start_page}-{ch.end_page}) | figures={fig_count} | inline_logo={has_inline}")

ch1 = b.chapters[0]
print("\n--- Ch 1 HTML preview (with inline logo) ---")
print(ch1.formatted_html[:600])

ch6 = b.chapters[5] # Ch 6 (Solids)
print("\n--- Ch 6 HTML preview (with Fig 1.1 and 1.2) ---")
print(ch6.formatted_html[:800])

db.close()
