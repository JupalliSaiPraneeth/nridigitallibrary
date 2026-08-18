import io
import os
import numpy as np
from PIL import Image

# Global OCR reader instance for EasyOCR (lazy initialized)
_easyocr_reader = None

def get_ocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            _easyocr_reader = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            print(f"[OCR Engine] Notice: EasyOCR reader init: {e}")
            _easyocr_reader = False
    return _easyocr_reader

def run_ocr_on_image(image_bytes: bytes) -> dict:
    """
    Runs OCR on rasterized image bytes.
    Returns:
    {
        "text": str,
        "confidence": float (0-100),
        "low_confidence": bool,
        "engine": str
    }
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # 1. Try EasyOCR if available
    reader = get_ocr_reader()
    if reader:
        try:
            img_np = np.array(image)
            results = reader.readtext(img_np)
            extracted_lines = []
            confidences = []
            for bbox, text, conf in results:
                if text.strip():
                    extracted_lines.append(text.strip())
                    confidences.append(conf * 100)
            avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
            full_text = "\n".join(extracted_lines)
            return {
                "text": full_text,
                "confidence": round(avg_conf, 1),
                "low_confidence": avg_conf < 65.0,
                "engine": "EasyOCR"
            }
        except Exception as e:
            print(f"[OCR Engine] EasyOCR error: {e}")

    # 2. Try pytesseract fallback if available
    try:
        import pytesseract
        text = pytesseract.image_to_string(image)
        # Try getting data for confidence
        try:
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            confs = [float(c) for c in data.get("conf", []) if float(c) > 0]
            avg_conf = sum(confs) / len(confs) if confs else 70.0
        except Exception:
            avg_conf = 75.0 if len(text.strip()) > 50 else 40.0

        return {
            "text": text.strip(),
            "confidence": round(avg_conf, 1),
            "low_confidence": avg_conf < 65.0,
            "engine": "Tesseract"
        }
    except Exception as e:
        print(f"[OCR Engine] Pytesseract fallback notice: {e}")

    return {
        "text": "",
        "confidence": 0.0,
        "low_confidence": True,
        "engine": "None"
    }
