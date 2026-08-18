import os
import sys
import io
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pymupdf
from PIL import Image, ImageDraw
from backend.pipeline.validator import validate_pdf_file
from backend.pipeline.extractor import PDFExtractor
from backend.pipeline.structure_parser import StructureParser
from backend.pipeline.metadata_engine import MetadataEngine
from backend.pipeline.cover_generator import generate_cover_thumbnail

def create_sample_pdf_with_images(filepath: str):
    doc = pymupdf.open()

    # Create a small diagram image using PIL
    img = Image.new("RGB", (400, 200), color=(240, 245, 255))
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 380, 180], outline=(237, 107, 16), width=3)
    draw.text((40, 50), "Neural Network Architecture Diagram", fill=(15, 23, 42))
    draw.text((40, 90), "Layer 1: Input -> Layer 2: Hidden -> Layer 3: Output", fill=(71, 85, 105))
    draw.ellipse([60, 120, 100, 160], fill=(237, 107, 16))
    draw.ellipse([180, 120, 220, 160], fill=(5, 150, 105))
    draw.ellipse([300, 120, 340, 160], fill=(217, 119, 6))

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    # Page 1: Title & Author cover
    p1 = doc.new_page()
    p1.insert_text((72, 100), "Deep Learning & Neural Network Architectures", fontsize=22, fontname="helv", color=(0.1, 0.1, 0.2))
    p1.insert_text((72, 140), "A Comprehensive Engineering Handbook", fontsize=14, fontname="helv", color=(0.9, 0.4, 0.1))
    p1.insert_text((72, 200), "By Dr. K. Srinivas & Prof. R. V. Rao", fontsize=13, fontname="helv")
    p1.insert_text((72, 230), "Department of Computer Science & Engineering", fontsize=11, fontname="helv")
    p1.insert_text((72, 260), "Published by NRI Institute of Technology Academic Press", fontsize=11, fontname="helv")
    p1.insert_text((72, 290), "ISBN: 978-0-13-468599-1", fontsize=11, fontname="helv")
    p1.insert_text((72, 320), "Copyright 2026", fontsize=11, fontname="helv")

    # Page 2: Chapter 1 with embedded diagram image
    p2 = doc.new_page()
    p2.insert_text((72, 80), "Chapter 1: Foundations of Artificial Intelligence", fontsize=18, fontname="helv")
    p2.insert_text((72, 120), "1.1 Historical Evolution of Neural Models", fontsize=14, fontname="helv")
    p2.insert_text((72, 150), "Artificial intelligence and computational neural networks have evolved from basic perceptrons into multifaceted deep hierarchical networks.", fontsize=11, fontname="helv")
    p2.insert_text((72, 180), "Key Takeaway: Gradient descent optimization is fundamental to modern deep learning convergence.", fontsize=11, fontname="helv")
    
    # Insert diagram image
    img_rect = pymupdf.Rect(72, 210, 472, 410)
    p2.insert_image(img_rect, stream=img_bytes)

    p2.insert_text((72, 440), "• Biological vs Artificial Neuron Architectures", fontsize=11, fontname="helv")
    p2.insert_text((72, 460), "• Mathematical Formulations of Activation Functions", fontsize=11, fontname="helv")
    p2.insert_text((72, 480), "• Backpropagation and Loss Surface Exploration", fontsize=11, fontname="helv")

    # Page 3: Chapter 2
    p3 = doc.new_page()
    p3.insert_text((72, 80), "Chapter 2: Convolutional and Recurrent Architectures", fontsize=18, fontname="helv")
    p3.insert_text((72, 120), "2.1 Spatial Feature Hierarchies", fontsize=14, fontname="helv")
    p3.insert_text((72, 150), "Convolutional Neural Networks utilize local receptive fields, shared weights, and spatial pooling to extract invariant visual representations.", fontsize=11, fontname="helv")
    p3.insert_text((72, 180), "2.2 Sequence Modeling with Transformers", fontsize=14, fontname="helv")
    p3.insert_text((72, 210), "Self-attention mechanisms allow sequence modeling without recurrence constraints, facilitating massive parallel training on large corpora.", fontsize=11, fontname="helv")

    doc.save(filepath)
    doc.close()
    print(f"[Test Setup] Created sample PDF with embedded images at {filepath}")

def test_full_pipeline():
    sample_path = "backend/storage/sample_test_book.pdf"
    images_dir = "backend/storage/images"
    covers_dir = "backend/storage/covers"
    os.makedirs("backend/storage", exist_ok=True)
    os.makedirs(images_dir, exist_ok=True)
    os.makedirs(covers_dir, exist_ok=True)

    create_sample_pdf_with_images(sample_path)

    start_time = time.time()

    # 1. Validation
    val = validate_pdf_file(sample_path)
    print("1. Validation passed:", val)

    # 2. Fast Extraction & Image Harvesting
    extractor = PDFExtractor(
        sample_path,
        images_output_dir=images_dir,
        image_url_prefix="/storage/images",
        image_prefix="test_ingest"
    )
    pages = extractor.extract_all_pages()
    duration = time.time() - start_time
    print(f"2. Extracted {len(pages)} pages in {duration:.3f}s with overall confidence {extractor.overall_confidence}%")
    print(f"   -> Total embedded images/diagrams extracted: {extractor.extracted_images_count}")
    assert extractor.extracted_images_count >= 1, "Expected at least 1 image to be extracted"

    # 3. Metadata
    meta_engine = MetadataEngine(pages, "sample_test_book.pdf")
    meta = meta_engine.extract_metadata()
    print("3. Extracted Metadata:", {
        "title": meta["title"],
        "authors": meta["authors"],
        "isbn": meta["isbn"],
        "department": meta["department"],
        "pub_year": meta["publication_year"]
    })

    # 4. Chapters & Embedded Figures in HTML
    parser = StructureParser(extractor.doc, pages)
    chapters = parser.extract_chapters()
    print(f"4. Detected {len(chapters)} Chapters:")
    for ch in chapters:
        img_count = len(ch.get("images", []))
        has_fig_html = "reader-figure-card" in ch["formatted_html"]
        print(f"   - Ch {ch['chapter_number']}: {ch['title']} (Pages {ch['start_page']}-{ch['end_page']}) | Images: {img_count} | Rich Figure Card: {has_fig_html}")

    # 5. Cover Thumbnail
    cover_url = generate_cover_thumbnail(sample_path, covers_dir, "test_cover")
    print(f"5. Cover thumbnail generated: {cover_url}")

    extractor.close()
    print(f"\n[SUCCESS] ALL PIPELINE & IMAGE EXTRACTION TESTS PASSED! Total pipeline time: {time.time() - start_time:.3f}s")

if __name__ == "__main__":
    test_full_pipeline()
