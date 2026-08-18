import os
import pymupdf

def generate_cover_thumbnail(pdf_path: str, output_dir: str, file_prefix: str) -> str:
    """
    Renders page 1 of the PDF into an optimized PNG thumbnail for cover display.
    Returns the filename of the generated cover.
    """
    os.makedirs(output_dir, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    if len(doc) == 0:
        doc.close()
        return None

    # Load page 1
    page = doc[0]
    # Render with 150 DPI for crisp visual presentation
    pix = page.get_pixmap(dpi=150)
    cover_filename = f"{file_prefix}_cover.png"
    cover_filepath = os.path.join(output_dir, cover_filename)

    pix.save(cover_filepath)
    doc.close()

    return f"/storage/covers/{cover_filename}"
