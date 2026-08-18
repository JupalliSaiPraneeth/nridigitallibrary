import os
import hashlib
import pymupdf

MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB

class PDFValidationError(Exception):
    pass

def validate_pdf_file(file_path: str) -> dict:
    """
    Validates a PDF file:
    - Verifies file exists
    - Verifies file size
    - Verifies PDF magic bytes (%PDF-)
    - Checks for encryption/password lock
    - Tests readability with PyMuPDF
    - Computes SHA256 file hash for duplicate detection
    """
    if not os.path.exists(file_path):
        raise PDFValidationError(f"File not found: {file_path}")

    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise PDFValidationError("The uploaded file is empty (0 bytes).")
    if file_size > MAX_FILE_SIZE_BYTES:
        raise PDFValidationError(f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum limit of 500 MB.")

    # Check magic bytes
    with open(file_path, "rb") as f:
        header = f.read(5)
        if not header.startswith(b"%PDF-"):
            raise PDFValidationError("Invalid file format. The file is not a valid PDF document.")
        f.seek(0)
        sha256 = hashlib.sha256(f.read()).hexdigest()

    # Open and verify integrity with PyMuPDF
    try:
        doc = pymupdf.open(file_path)
    except Exception as e:
        raise PDFValidationError(f"Corrupted or invalid PDF structure: {str(e)}")

    if doc.is_encrypted:
        doc.close()
        raise PDFValidationError("The uploaded PDF is password-protected or encrypted. Please provide an unlocked PDF.")

    page_count = len(doc)
    if page_count == 0:
        doc.close()
        raise PDFValidationError("The PDF has 0 pages.")

    doc.close()

    return {
        "valid": True,
        "page_count": page_count,
        "file_size": file_size,
        "file_hash": sha256
    }
