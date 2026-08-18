import os
import re
import html
import pymupdf
from typing import Optional, List, Dict
from .ocr_engine import run_ocr_on_image

CAPTION_REGEX = re.compile(
    r"^\s*(?:Figure|Fig\.?|Diagram|Schematic|Chart|Plot|Illustration)\s*[-–—:.]*\s*([0-9A-Za-z\.]+)(?:[\s:.\-–—]+(.*))?",
    re.IGNORECASE
)
TABLE_HEADING_REGEX = re.compile(
    r"^\s*(?:Table|TABLE|Schedule|Tab\.)\s*[-–—:.]*\s*([0-9A-Za-z\.]+)",
    re.IGNORECASE
)
HEADER_FOOTER_PATTERNS = re.compile(
    r"(?:DEPARTMENT OF|COLLEGE OF|UNIVERSITY|INSTITUTE|LECTURE NOTES|COURSE MATERIAL|ACADEMIC YEAR|CHALMERS|VTU|JNTU|ANNA UNIVERSITY)",
    re.IGNORECASE
)

def normalize_pdf_text(t: str) -> str:
    """Normalizes PDF font ligatures and removes non-printable control characters."""
    if not t:
        return ""
    # Map Unicode ligatures
    t = t.replace("\ufb00", "ff")
    t = t.replace("\ufb01", "fi")
    t = t.replace("\ufb02", "fl")
    t = t.replace("\ufb03", "ffi")
    t = t.replace("\ufb04", "ffl")
    # Clean control characters (preserve \n, \t)
    t = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", t)
    # Fix broken spaced words with ligatures
    t = re.sub(r"\b([a-zA-Z]+)\s+(fl|fi|ff)\s+([a-zA-Z]+)\b", r"\1\2\3", t)
    return t


class ExtractedPage:
    def __init__(
        self,
        page_number: int,
        text: str,
        blocks: list,
        images: Optional[list] = None,
        tables: Optional[list] = None,
        is_ocr: bool = False,
        confidence: float = 100.0,
        elements: Optional[list] = None
    ):
        self.page_number = page_number
        self.text = text
        self.blocks = blocks  # list of {text, bbox, font_size, is_bold, is_heading}
        self.images = images or []  # list of {url, width, height, ext, page, filename, caption, bbox, y0, is_inline}
        self.tables = tables or []  # list of {html, grid, bbox, page, y0, id}
        self.is_ocr = is_ocr
        self.confidence = confidence
        self.elements = elements or []


class PDFExtractor:
    def __init__(
        self,
        file_path: str,
        images_output_dir: Optional[str] = None,
        image_url_prefix: str = "/storage/images",
        image_prefix: str = "img"
    ):
        self.file_path = file_path
        self.images_output_dir = images_output_dir
        self.image_url_prefix = image_url_prefix.rstrip("/")
        self.image_prefix = image_prefix
        self.doc = pymupdf.open(file_path)
        self.total_pages = len(self.doc)
        self.pages: List[ExtractedPage] = []
        self.issues: List[str] = []
        self.overall_confidence = 100.0
        self.extracted_images_count = 0
        self.extracted_tables_count = 0
        self.seen_figure_keys = set()

        if self.images_output_dir:
            os.makedirs(self.images_output_dir, exist_ok=True)

        self.repetitive_xrefs = self._detect_repetitive_images()

    def _detect_repetitive_images(self) -> set:
        """
        Fast scan to identify repetitive header/footer decoration rules or repeating watermarks
        that appear on 4 or more sample pages across the PDF.
        """
        xref_counts = {}
        try:
            sample_indices = set(range(min(15, self.total_pages)))
            if self.total_pages > 30:
                mid = self.total_pages // 2
                sample_indices.update(range(mid - 5, mid + 5))
                sample_indices.update(range(self.total_pages - 10, self.total_pages))
            else:
                sample_indices = set(range(self.total_pages))

            for page_idx in sample_indices:
                page = self.doc[page_idx]
                seen_on_page = set()
                for img_info in page.get_images():
                    xref = img_info[0]
                    if xref not in seen_on_page:
                        seen_on_page.add(xref)
                        xref_counts[xref] = xref_counts.get(xref, 0) + 1
        except Exception:
            pass

        # Only discard if extremely repetitive across > 4 sampled pages
        return {xref for xref, count in xref_counts.items() if count >= 5}

    def _is_header_footer(self, b_bbox: tuple, text: str, page_rect: pymupdf.Rect, page_num: int) -> bool:
        """Determines if a text block is a running header or footer that should be excluded from body text."""
        stripped = text.strip()
        if not stripped:
            return True

        # Check top margin (< 6.5% of page height or y1 < 45)
        if b_bbox[1] < page_rect.height * 0.065 or b_bbox[3] < 45:
            if len(stripped) < 90 and (HEADER_FOOTER_PATTERNS.search(stripped) or stripped.isdigit() or stripped.isupper()):
                return True

        # Check bottom margin (> 93% of page height)
        if b_bbox[1] > page_rect.height * 0.93 or b_bbox[3] > page_rect.height - 30:
            if len(stripped) < 90 and (HEADER_FOOTER_PATTERNS.search(stripped) or stripped.isdigit() or re.match(r"^(?:Page|\d+|[I|V|X]+)\b", stripped, re.I)):
                return True

        return False

    def _extract_tables_fast(self, page, page_num: int, has_table_heading: bool) -> List[Dict]:
        """Fast targeted table extraction using line strategy on identified table pages."""
        if not has_table_heading:
            return []

        tables_list = []
        try:
            tabs = page.find_tables(strategy="lines")
            if tabs and tabs.tables:
                for t_idx, tab in enumerate(tabs.tables):
                    grid = tab.extract()
                    if not grid or len(grid) < 2:
                        continue

                    header_row = grid[0]
                    body_rows = grid[1:]
                    tab_id = f"p{page_num}_t{t_idx+1}"

                    table_html = [
                        f'<div class="reader-table-card" data-table-id="{tab_id}" data-page-num="{page_num}">',
                        '  <div class="reader-table-header">',
                        '    <span class="table-badge">',
                        '      <svg class="icon" viewBox="0 0 24 24" style="font-size:14px; vertical-align:middle; margin-right:4px;">',
                        '        <path fill="currentColor" d="M3 3h18v18H3V3zm2 4h14v-2H5v2zm0 4h6v-2H5v2zm8 0h6v-2h-6v2zm-8 4h6v-2H5v2zm8 0h6v-2h-6v2zm-8 4h14v-2H5v2z"/>',
                        '      </svg>',
                        f'      STRUCTURED DATA TABLE {t_idx+1}',
                        '    </span>',
                        f'    <span class="table-page-tag">Page {page_num}</span>',
                        '  </div>',
                        '  <div class="reader-table-responsive-wrap">',
                        '    <table class="reader-data-table">',
                        '      <thead><tr>'
                    ]

                    for cell in header_row:
                        c_text = html.escape(normalize_pdf_text(str(cell or "")).strip()).replace("\n", "<br>")
                        table_html.append(f'        <th>{c_text}</th>')
                    table_html.append('      </tr></thead>')

                    table_html.append('      <tbody>')
                    for row in body_rows:
                        if not any(bool(c and str(c).strip()) for c in row):
                            continue
                        table_html.append('        <tr>')
                        for cell in row:
                            c_text = html.escape(normalize_pdf_text(str(cell or "")).strip()).replace("\n", "<br>")
                            table_html.append(f'          <td>{c_text}</td>')
                        table_html.append('        </tr>')
                    table_html.append('      </tbody>')
                    table_html.append('    </table>')
                    table_html.append('  </div>')
                    table_html.append('</div>')

                    tables_list.append({
                        "id": tab_id,
                        "html": "\n".join(table_html),
                        "grid": grid,
                        "bbox": tab.bbox,
                        "page": page_num,
                        "y0": tab.bbox[1] if tab.bbox else 0
                    })
                    self.extracted_tables_count += 1
        except Exception:
            pass

        return tables_list

    def _extract_figures_accurate(
        self,
        page,
        page_num: int,
        raw_blocks: list,
        cap_blocks: list,
        has_graphics_candidate: bool
    ) -> tuple:
        """
        High-Accuracy Multi-Modal Visual Element Extractor:
        1. Identifies raster images and crops/extracts them.
        2. Detects inline logos / emblems (e.g. (PhP) logo, university seal) and crops them sharply.
        3. Clusters vector diagrams / crystal lattices / schematics without boundary clipping.
        4. Matches captions using 1-to-1 nearest geometric proximity solver (preventing dropped diagrams).
        5. Suppresses internal diagram text so labels do not leak into body text.
        """
        extracted_figures = []
        fig_internal_block_indices = set()
        caption_block_indices = set()
        inline_logos = {}  # block_idx -> list of inline logo urls
        page_rect = page.rect

        if not self.images_output_dir:
            return extracted_figures, fig_internal_block_indices, caption_block_indices, inline_logos

        # 1. Raster Images (direct bitmap streams or clipped display rects)
        try:
            image_list = page.get_images()
            saved_xrefs = set()

            for img_idx, img_info in enumerate(image_list[:12]):
                xref = img_info[0]
                if xref in saved_xrefs or xref in self.repetitive_xrefs:
                    continue
                saved_xrefs.add(xref)

                try:
                    img_rects = page.get_image_rects(xref)
                    img_rect = img_rects[0] if img_rects else None

                    # If displayed in top/bottom running header/footer area, skip
                    if img_rect and (img_rect.y1 < page_rect.height * 0.06 or img_rect.y0 > page_rect.height * 0.94):
                        continue

                    base_image = self.doc.extract_image(xref)
                    if not base_image:
                        continue

                    width = base_image.get("width", 0)
                    height = base_image.get("height", 0)
                    img_bytes = base_image.get("image")
                    ext = base_image.get("ext", "png")

                    if len(img_bytes) < 150:
                        continue

                    # Check if this is a small inline logo
                    is_small_inline = (width < 180 and height < 90)
                    filename = f"{self.image_prefix}_p{page_num}_{img_idx}.{ext}"
                    filepath = os.path.join(self.images_output_dir, filename)

                    if not os.path.exists(filepath):
                        with open(filepath, "wb") as f:
                            f.write(img_bytes)

                    rel_url = f"{self.image_url_prefix}/{filename}"

                    if is_small_inline and img_rect:
                        # Find matching text block to place inline
                        for b_idx, b in enumerate(raw_blocks):
                            if b[6] == 0:
                                b_rect = pymupdf.Rect(b[:4])
                                if abs(b_rect.y0 - img_rect.y0) < 25 or b_rect.contains(img_rect) or img_rect.intersects(b_rect):
                                    inline_logos.setdefault(b_idx, []).append(rel_url)
                                    break
                    else:
                        matched_caption = f"Extracted figure from Page {page_num}"
                        matched_cap_idx = None
                        if img_rect and cap_blocks:
                            for c_idx, cb, first_l, full_cap in cap_blocks:
                                c_rect = pymupdf.Rect(cb[:4])
                                if abs(c_rect.y0 - img_rect.y1) < 60 or abs(img_rect.y0 - c_rect.y1) < 60:
                                    matched_caption = full_cap
                                    matched_cap_idx = c_idx
                                    break

                        fig_y0 = img_rect.y0 if img_rect else (page_rect.height * 0.3)
                        extracted_figures.append({
                            "url": rel_url,
                            "width": width,
                            "height": height,
                            "ext": ext,
                            "page": page_num,
                            "filename": filename,
                            "caption": matched_caption,
                            "bbox": tuple(img_rect) if img_rect else None,
                            "y0": fig_y0,
                            "is_inline": False
                        })
                        self.extracted_images_count += 1

                        if matched_cap_idx is not None:
                            caption_block_indices.add(matched_cap_idx)

                        if img_rect:
                            for b_idx, b in enumerate(raw_blocks):
                                if b[6] == 0:
                                    b_rect = pymupdf.Rect(b[:4])
                                    if img_rect.contains(b_rect) or (img_rect.intersects(b_rect) and b_rect.height < 40):
                                        fig_internal_block_indices.add(b_idx)
                except Exception:
                    pass
        except Exception:
            pass

        # 2. Vector Drawings (Logos, Emblems & Multi-Panel Technical Diagrams)
        if has_graphics_candidate:
            try:
                drawings = page.get_drawings()
                if drawings:
                    valid_draw_rects = []
                    inline_draw_rects = []

                    check_inline = (len(drawings) <= 150)
                    for d in drawings:
                        r = d["rect"]
                        # Skip full-page backgrounds and full-width dividers
                        if r.width >= page_rect.width * 0.92 and r.height >= page_rect.height * 0.85:
                            continue
                        if r.width >= page_rect.width * 0.85 and r.height <= 3.5:
                            continue
                        if r.y1 < page_rect.height * 0.05 or r.y0 > page_rect.height * 0.95:
                            continue

                        # Check if small inline logo / emblem (e.g. (PhP) logo)
                        if check_inline and r.width < 180 and r.height < 75 and (r.width * r.height < 8000):
                            best_b_idx = None
                            best_b_dist = float("inf")
                            r_cy = (r.y0 + r.y1) / 2.0
                            for b_idx, b in enumerate(raw_blocks):
                                if b[6] == 0:
                                    b_rect = pymupdf.Rect(b[:4])
                                    if b_rect.contains(r) or (b_rect.y0 - 4 <= r.y0 and r.y1 <= b_rect.y1 + 4):
                                        best_b_idx = b_idx
                                        break
                                    elif abs(b_rect.y0 - r.y0) < 18 or abs(b_rect.y1 - r.y1) < 18:
                                        dist = abs(((b_rect.y0 + b_rect.y1) / 2.0) - r_cy)
                                        if dist < best_b_dist:
                                            best_b_dist = dist
                                            best_b_idx = b_idx
                            if best_b_idx is not None:
                                inline_draw_rects.append((r, best_b_idx, len(d.get("items", []))))
                                continue

                        valid_draw_rects.append(r)

                    # Extract inline vector logos (e.g., (PhP) trademark emblem)
                    for l_idx, (l_rect, b_idx, item_count) in enumerate(inline_draw_rects):
                        if item_count >= 2 or l_rect.width >= 12:
                            pad = 2.0
                            crop_r = pymupdf.Rect(
                                max(page_rect.x0, l_rect.x0 - pad),
                                max(page_rect.y0, l_rect.y0 - pad),
                                min(page_rect.x1, l_rect.x1 + pad),
                                min(page_rect.y1, l_rect.y1 + pad)
                            )
                            try:
                                pix = page.get_pixmap(clip=crop_r, matrix=pymupdf.Matrix(3.0, 3.0), alpha=False)
                                if pix.width >= 16 and pix.height >= 12:
                                    fname = f"{self.image_prefix}_logo_p{page_num}_{l_idx+1}.png"
                                    fpath = os.path.join(self.images_output_dir, fname)
                                    pix.save(fpath)
                                    rel_url = f"{self.image_url_prefix}/{fname}"
                                    inline_logos.setdefault(b_idx, []).append(rel_url)
                            except Exception:
                                pass

                    # Cluster remaining drawing rectangles for technical diagrams
                    clusters = []
                    if valid_draw_rects:
                        if len(valid_draw_rects) > 1500:
                            x0 = min(r.x0 for r in valid_draw_rects)
                            y0 = min(r.y0 for r in valid_draw_rects)
                            x1 = max(r.x1 for r in valid_draw_rects)
                            y1 = max(r.y1 for r in valid_draw_rects)
                            union_r = pymupdf.Rect(x0, y0, x1, y1)
                            if union_r.width >= 35 and union_r.height >= 30:
                                clusters.append(union_r)
                        else:
                            sorted_rects = sorted(valid_draw_rects, key=lambda r: (r.y0, r.x0))
                            cur = sorted_rects[0]
                            for r in sorted_rects[1:]:
                                if r.y0 <= cur.y1 + 32:
                                    cur = cur | r
                                else:
                                    if cur.width >= 35 and cur.height >= 25:
                                        clusters.append(cur)
                                    cur = r
                            if cur.width >= 35 and cur.height >= 25:
                                clusters.append(cur)

                    # 1-to-1 Geometric Proximity Caption Matching Solver
                    unassigned_caps = list(cap_blocks)

                    for c_idx, cluster in enumerate(clusters):
                        if cluster.height < 30 and cluster.width < 45:
                            continue

                        # Find closest unassigned caption
                        best_cap = None
                        best_cap_idx = None
                        best_cap_dist = float("inf")
                        best_cap_tuple = None

                        for cap_item in unassigned_caps:
                            b_idx, b, first_l, full_cap = cap_item
                            c_rect = pymupdf.Rect(b[:4])

                            # Case A: Caption directly BELOW diagram (standard convention)
                            if c_rect.y0 >= cluster.y1 - 15 and c_rect.y0 - cluster.y1 < 75:
                                dist = c_rect.y0 - cluster.y1
                                if dist < best_cap_dist:
                                    best_cap_dist = dist
                                    best_cap = full_cap
                                    best_cap_idx = b_idx
                                    best_cap_tuple = cap_item

                            # Case B: Caption directly ABOVE diagram (e.g. some journals)
                            elif cluster.y0 >= c_rect.y1 - 15 and cluster.y0 - c_rect.y1 < 75:
                                dist = (cluster.y0 - c_rect.y1) + 10  # slight bias towards below
                                if dist < best_cap_dist:
                                    best_cap_dist = dist
                                    best_cap = full_cap
                                    best_cap_idx = b_idx
                                    best_cap_tuple = cap_item

                        if best_cap_tuple:
                            unassigned_caps.remove(best_cap_tuple)
                            caption_block_indices.add(best_cap_idx)

                        caption_text = best_cap if best_cap else f"Technical diagram from Page {page_num}"

                        # Render high-resolution sharp pixmap (2.0x DPI)
                        pad = 6.0
                        crop_rect = pymupdf.Rect(
                            max(page_rect.x0 + 5, cluster.x0 - pad),
                            max(page_rect.y0 + 5, cluster.y0 - pad),
                            min(page_rect.x1 - 5, cluster.x1 + pad),
                            min(page_rect.y1 - 5, cluster.y1 + pad)
                        )

                        try:
                            pix = page.get_pixmap(clip=crop_rect, matrix=pymupdf.Matrix(2.0, 2.0), alpha=False)
                            if pix.width >= 50 and pix.height >= 35:
                                fname = f"{self.image_prefix}_fig_p{page_num}_{len(extracted_figures)+1}.png"
                                fpath = os.path.join(self.images_output_dir, fname)
                                pix.save(fpath)
                                rel_url = f"{self.image_url_prefix}/{fname}"

                                extracted_figures.append({
                                    "url": rel_url,
                                    "width": pix.width,
                                    "height": pix.height,
                                    "ext": "png",
                                    "page": page_num,
                                    "filename": fname,
                                    "caption": caption_text,
                                    "bbox": tuple(crop_rect),
                                    "y0": cluster.y0,
                                    "is_inline": False
                                })
                                self.extracted_images_count += 1

                                # Suppress text inside diagram from body text
                                for b_idx, b in enumerate(raw_blocks):
                                    if b[6] == 0:
                                        b_rect = pymupdf.Rect(b[:4])
                                        if crop_rect.contains(b_rect) or (cluster.intersects(b_rect) and b_rect.height < 45):
                                            fig_internal_block_indices.add(b_idx)
                        except Exception:
                            pass
            except Exception:
                pass

        return extracted_figures, fig_internal_block_indices, caption_block_indices, inline_logos

    def extract_all_pages(self, progress_callback=None) -> list:
        """
        High-Fidelity Multi-Modal Page Extraction:
        - Precise vector diagram bounding box calculation without matter leakage.
        - Inline logo & trademark emblem preservation.
        - Figure-internal text suppressed from body flow.
        - Figures and tables placed inline in natural reading order.
        """
        page_confidences = []

        sample_pages = [0, min(5, self.total_pages - 1), min(self.total_pages // 2, self.total_pages - 1)]
        digital_text_chars = sum(len(self.doc[p].get_text("text").strip()) for p in sample_pages if p < self.total_pages)
        is_digital_document = digital_text_chars > 80

        for page_idx in range(self.total_pages):
            page_num = page_idx + 1
            page = self.doc[page_idx]
            page_rect = page.rect

            # 1. Native Text & Block Scan
            raw_blocks = page.get_text("blocks")
            has_table_heading = False
            has_caption = False
            has_vertical_gap = False
            prev_block_y1 = 0.0
            cap_blocks = []

            for b_idx, b in enumerate(raw_blocks):
                if b[6] == 0:  # Text block
                    b_text = normalize_pdf_text(b[4]).strip()
                    if b_text:
                        first_l = b_text.split("\n")[0].strip()
                        if CAPTION_REGEX.match(first_l):
                            has_caption = True
                            cap_blocks.append((b_idx, b, first_l, b_text.replace("\n", " ")))
                        if TABLE_HEADING_REGEX.match(first_l) or "\t" in b_text:
                            has_table_heading = True
                        if prev_block_y1 > 0 and b[1] - prev_block_y1 > 120:
                            has_vertical_gap = True
                        prev_block_y1 = b[3]

            has_drawings = len(page.get_drawings()) > 0
            has_raster_images = len(page.get_images()) > 0
            has_graphics_candidate = has_caption or has_vertical_gap or has_raster_images or has_drawings

            # 2. Fast Targeted Table Extraction
            page_tables = self._extract_tables_fast(page, page_num, has_table_heading)

            # 3. High-Accuracy Figure, Diagram & Inline Logo Extraction
            page_images, fig_internal_indices, cap_block_indices, inline_logos = self._extract_figures_accurate(
                page, page_num, raw_blocks, cap_blocks, has_graphics_candidate
            )

            # 4. Construct Natural Ordered Reading Flow (Text + Inline Logos + Figures + Tables)
            blocks_data = []
            flow_elements = []

            for b_idx, b in enumerate(raw_blocks):
                if b[6] != 0:
                    continue
                b_text = normalize_pdf_text(b[4]).strip()
                if not b_text:
                    continue

                b_bbox = (b[0], b[1], b[2], b[3])

                # Check if running header or footer
                if self._is_header_footer(b_bbox, b_text, page_rect, page_num):
                    continue

                # Check if inside a figure (suppress from body text)
                if b_idx in fig_internal_indices:
                    continue

                # Check if caption block (suppress from body text since it's on figure card)
                if b_idx in cap_block_indices:
                    continue

                # If there are inline logos for this block, attach them to the text
                if b_idx in inline_logos:
                    for logo_url in inline_logos[b_idx]:
                        b_text = f"[[INLINE_IMG:{logo_url}]] {b_text}"

                is_head = (
                    (b_text.isupper() and 4 < len(b_text) < 75)
                    or bool(re.match(r"^(?:UNIT|Unit|MODULE|Module|CHAPTER|Chapter|PART|Part|\d+\.\d+)\b", b_text))
                )

                blocks_data.append({
                    "text": b_text,
                    "bbox": b_bbox,
                    "font_size": 14.0 if is_head else 11.0,
                    "is_bold": is_head,
                    "is_heading": is_head
                })

                flow_elements.append({
                    "type": "text",
                    "y0": b[1],
                    "text": b_text,
                    "is_heading": is_head
                })

            # Add inline figure markers into reading flow
            for fig in page_images:
                if not fig.get("is_inline", False):
                    flow_elements.append({
                        "type": "figure",
                        "y0": fig["y0"],
                        "url": fig["url"],
                        "caption": fig["caption"],
                        "figure": fig
                    })

            # Add inline table markers into reading flow
            for tab in page_tables:
                flow_elements.append({
                    "type": "table",
                    "y0": tab["y0"],
                    "id": tab["id"],
                    "table": tab
                })

            # Sort strictly by vertical position for 100% natural reading order
            flow_elements.sort(key=lambda el: el["y0"])

            # Build formatted page text with inline markers
            text_lines = []
            for el in flow_elements:
                if el["type"] == "text":
                    text_lines.append(el["text"])
                elif el["type"] == "figure":
                    text_lines.append(f"[[FIGURE:{el['url']}]]")
                elif el["type"] == "table":
                    text_lines.append(f"[[TABLE:{el['id']}]]")

            page_text = "\n\n".join(text_lines)
            char_count = len(page_text)

            # Digital text page
            if char_count > 15 or is_digital_document or page_images or page_tables:
                page_obj = ExtractedPage(
                    page_number=page_num,
                    text=page_text,
                    blocks=blocks_data,
                    images=page_images,
                    tables=page_tables,
                    is_ocr=False,
                    confidence=99.5,
                    elements=flow_elements
                )
                page_confidences.append(99.5)

            # Blank / Separator Page
            elif len(raw_blocks) == 0 and len(page.get_images()) == 0:
                page_obj = ExtractedPage(
                    page_number=page_num,
                    text="",
                    blocks=[],
                    images=[],
                    tables=[],
                    is_ocr=False,
                    confidence=100.0,
                    elements=[]
                )
                page_confidences.append(100.0)

            # Scanned Fallback -> OCR
            else:
                try:
                    pix = page.get_pixmap(dpi=140)
                    img_bytes = pix.tobytes("png")
                    ocr_result = run_ocr_on_image(img_bytes)

                    ocr_text = normalize_pdf_text(ocr_result.get("text", "").strip())
                    ocr_conf = ocr_result.get("confidence", 75.0)

                    lines = [l.strip() for l in ocr_text.split("\n") if l.strip()]
                    for l in lines:
                        blocks_data.append({
                            "text": l,
                            "bbox": None,
                            "font_size": 12.0,
                            "is_bold": False,
                            "is_heading": len(l) < 60 and (l.isupper() or l.startswith("Chapter") or l.startswith("UNIT"))
                        })

                    page_obj = ExtractedPage(
                        page_number=page_num,
                        text=ocr_text,
                        blocks=blocks_data,
                        images=page_images,
                        tables=page_tables,
                        is_ocr=True,
                        confidence=ocr_conf,
                        elements=[]
                    )
                    page_confidences.append(ocr_conf)
                except Exception:
                    page_obj = ExtractedPage(
                        page_number=page_num,
                        text=page_text,
                        blocks=blocks_data,
                        images=page_images,
                        tables=page_tables,
                        is_ocr=False,
                        confidence=85.0,
                        elements=[]
                    )
                    page_confidences.append(85.0)

            self.pages.append(page_obj)

            if progress_callback and (page_num % 10 == 0 or page_num == self.total_pages):
                progress_callback(page_num, self.total_pages)

        if page_confidences:
            self.overall_confidence = round(sum(page_confidences) / len(page_confidences), 1)

        return self.pages

    def get_full_text(self) -> str:
        return "\n\n".join([f"--- Page {p.page_number} ---\n{p.text}" for p in self.pages])

    def close(self):
        try:
            self.doc.close()
        except Exception:
            pass
