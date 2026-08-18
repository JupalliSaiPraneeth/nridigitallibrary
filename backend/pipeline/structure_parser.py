import re
import html
from typing import List, Dict, Optional

# Regex patterns to detect chapters, units, modules, parts
UNIT_REGEX = re.compile(
    r"^\s*(UNIT|Unit|MODULE|Module|CHAPTER|Chapter|PART|Part|LESSON|Lesson|TOPIC|Topic)\s*[-–—:.]*\s*([0-9IVXLCDM]+)(?:[\s:.\-–—]+(.*))?$",
    re.IGNORECASE
)
NUMBERED_CHAPTER_REGEX = re.compile(r"^\s*([0-9]+)\.\s+([A-Z][A-Za-z0-9\s,\-:–—]{3,80})$")
REPETITIVE_HEADER_REGEX = re.compile(
    r"^(?:DEPARTMENT OF [^\n]+|COLLEGE OF [^\n]+|MALLA REDDY [^\n]+|NRI [^\n]+|COURSE MATERIAL|LECTURE NOTES|ACADEMIC YEAR|JAWAHARLAL NEHRU|ANNA UNIVERSITY|VTU)[\s:.\-–—]*",
    re.IGNORECASE
)

ROMAN_NUMERALS = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
    'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
    'XI': 11, 'XII': 12, 'XIII': 13, 'XIV': 14, 'XV': 15
}

def parse_num_val(s: str) -> Optional[int]:
    clean = s.strip().upper()
    if clean.isdigit():
        return int(clean)
    return ROMAN_NUMERALS.get(clean, None)

def clean_unit_title(raw_title: str) -> str:
    """Cleans extracted raw heading strings into human-readable titles without whitespace gaps."""
    t = raw_title.strip()
    t = REPETITIVE_HEADER_REGEX.sub("", t).strip()
    t = re.sub(r"\s*[/\\|–—]\s*$", "", t).strip()
    t = re.sub(r"\s+", " ", t)
    if t.isupper() and len(t) > 3:
        words = t.split()
        t = " ".join([w.capitalize() if w.upper() not in ["AND", "OR", "OF", "IN", "ON", "TO", "A", "AN", "THE", "FOR", "&"] else w.lower() for w in words])
        if t:
            t = t[0].upper() + t[1:]
    return t

def clean_text_whitespace(text: str) -> str:
    """Removes excessive vertical white space, duplicate empty lines, and repetitive margins."""
    if not text:
        return ""
    clean = text.replace("\r\n", "\n").replace("\r", "\n")
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    clean_lines = []
    for line in clean.split("\n"):
        stripped = line.strip()
        if re.match(r"^[-_=\.\s]{4,}$", stripped):
            continue
        if REPETITIVE_HEADER_REGEX.match(stripped) and len(stripped) < 70:
            continue
        clean_lines.append(stripped)
    return "\n".join(clean_lines)

def render_inline_elements(text_str: str) -> str:
    """Safely escapes HTML text while preserving [[INLINE_IMG:url]] as embedded HTML images."""
    if not text_str:
        return ""
    parts = re.split(r'(\[\[INLINE_IMG:.*?\]\])', text_str)
    rendered = []
    for p in parts:
        m = re.match(r'^\[\[INLINE_IMG:(.*?)\]\]$', p)
        if m:
            url = m.group(1).strip()
            rendered.append(f'<img src="{url}" class="reader-inline-logo" alt="Logo" loading="lazy" />')
        else:
            if p:
                rendered.append(html.escape(p))
    return "".join(rendered)

def build_figure_card_html(img: dict, page_num: int) -> str:
    url = img.get("url", "")
    caption_text = img.get("caption") or f"Extracted figure from Page {page_num}"
    caption_escaped = html.escape(caption_text)
    caption_js = caption_text.replace("'", "\\'").replace('"', '&quot;')

    return f'''
<div class="reader-figure-card" data-img-url="{url}" data-page-num="{page_num}">
  <div class="reader-figure-header">
    <span class="figure-badge">
      <svg class="icon" viewBox="0 0 24 24" style="font-size:15px; vertical-align:middle; margin-right:4px;">
        <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      EXTRACTED FIGURE / DIAGRAM
    </span>
    <div style="display:flex; align-items:center; gap:8px;">
      <span class="figure-page-tag">Page {page_num}</span>
      <button class="figure-admin-delete-btn" type="button" title="Remove Extracted Image" onclick="handleInReaderDeleteFigure(this, '{url}', {page_num}); event.stopPropagation();">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        <span>Remove</span>
      </button>
    </div>
  </div>
  <div class="reader-figure-img-wrap" onclick="openFigureZoom('{url}', '{caption_js}')">
    <img src="{url}" alt="{caption_escaped}" class="reader-figure-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"/>
    <div class="figure-fallback-placeholder" style="display:none; padding:20px; text-align:center; color:var(--text-muted); background:var(--bg-secondary); border-radius:8px;">
      <p style="font-weight:700; color:var(--accent-orange-bright); margin-bottom:4px;">High-Resolution Technical Diagram</p>
      <p style="font-size:0.8rem;">Page {page_num} schematic figure</p>
    </div>
    <div class="figure-zoom-hint">
      <svg class="icon" viewBox="0 0 24 24" style="font-size:14px; vertical-align:middle; margin-right:4px;">
        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
      Click to Zoom
    </div>
  </div>
  <div class="reader-figure-caption">{caption_escaped}</div>
</div>'''

def format_text_to_rich_html(
    text: str,
    page_images_map: Optional[Dict[int, List[Dict]]] = None,
    page_tables_map: Optional[Dict[int, List[Dict]]] = None
) -> str:
    """
    Transforms structured chapter text into clean, tightly-spaced, rich HTML for the digital reader.
    Supports inline logo placement, figure cards, table cards, callout boxes, and bullet lists.
    """
    page_images_map = page_images_map or {}
    page_tables_map = page_tables_map or {}

    # Build fast lookup maps
    img_by_url = {}
    for p_num, imgs in page_images_map.items():
        for img in imgs:
            if "url" in img:
                img_by_url[img["url"]] = (img, p_num)

    table_by_id = {}
    for p_num, tabs in page_tables_map.items():
        for tab in tabs:
            if "id" in tab:
                table_by_id[tab["id"]] = (tab, p_num)

    clean_text = clean_text_whitespace(text)
    lines = [l.strip() for l in clean_text.split("\n")]
    html_parts = []
    in_list = False
    current_para = []
    rendered_image_urls = set()
    rendered_table_ids = set()
    current_page_num = 1

    def flush_para():
        nonlocal current_para
        if current_para:
            p_text = " ".join(current_para).strip()
            p_text = re.sub(r"\s+", " ", p_text)
            if p_text and len(p_text) > 1:
                rendered_inner = render_inline_elements(p_text)
                if re.match(r"^(?:Note|Important|Key Takeaway|Definition|Concept|Remark)[\s:]", p_text, re.IGNORECASE):
                    html_parts.append(f'<div class="reader-callout-box"><div class="callout-badge">KEY CONCEPT</div><p>{rendered_inner}</p></div>')
                else:
                    html_parts.append(f'<p class="reader-text-p">{rendered_inner}</p>')
            current_para = []

    def flush_list():
        nonlocal in_list
        if in_list:
            html_parts.append("</ul>")
            in_list = False

    for stripped in lines:
        if not stripped:
            flush_para()
            flush_list()
            continue

        # 1. Page divider
        if re.match(r"^---\s*Page\s+\d+\s*---$", stripped):
            flush_para()
            flush_list()
            page_num_match = re.search(r"\d+", stripped)
            current_page_num = int(page_num_match.group(0)) if page_num_match else 0
            html_parts.append(f'<div class="reader-page-divider"><span>Page {current_page_num}</span></div>')
            continue

        # 2. Inline Figure Marker: [[FIGURE:url]]
        fig_match = re.match(r"^\[\[FIGURE:(.*?)\]\]$", stripped)
        if fig_match:
            flush_para()
            flush_list()
            fig_url = fig_match.group(1).strip()
            if fig_url in img_by_url and fig_url not in rendered_image_urls:
                img_data, p_num = img_by_url[fig_url]
                rendered_image_urls.add(fig_url)
                html_parts.append(build_figure_card_html(img_data, p_num))
            continue

        # 3. Inline Table Marker: [[TABLE:id]]
        tab_match = re.match(r"^\[\[TABLE:(.*?)\]\]$", stripped)
        if tab_match:
            flush_para()
            flush_list()
            tab_id = tab_match.group(1).strip()
            if tab_id in table_by_id and tab_id not in rendered_table_ids:
                tab_data, p_num = table_by_id[tab_id]
                rendered_table_ids.add(tab_id)
                html_parts.append(tab_data.get("html", ""))
            continue

        # 4. Check for Section Headings
        if (
            (stripped.isupper() and 4 < len(stripped) < 70 and not stripped.endswith("."))
            or re.match(r"^\d+\.\d+\s+[A-Z]", stripped)
            or re.match(r"^(?:Section|Topic)\s+\d+", stripped, re.IGNORECASE)
        ):
            flush_para()
            flush_list()
            html_parts.append(f'<h3 class="reader-section-heading">{html.escape(stripped)}</h3>')
            continue

        # 5. Check for Subheadings
        if re.match(r"^\d+\.\d+\.\d+\s+[A-Z]", stripped):
            flush_para()
            flush_list()
            html_parts.append(f'<h4 class="reader-subheading">{html.escape(stripped)}</h4>')
            continue

        # 6. Check for Bullet List items
        list_match = re.match(r"^(?:[•\-\*]|\d+[\.\)])\s+(.*)$", stripped)
        if list_match:
            flush_para()
            if not in_list:
                html_parts.append('<ul class="reader-bullet-list">')
                in_list = True
            item_text = render_inline_elements(list_match.group(1))
            html_parts.append(f'<li>{item_text}</li>')
            continue

        # 7. Regular sentence line -> accumulate into current paragraph
        current_para.append(stripped)

    flush_para()
    flush_list()

    # Append any unreferenced figures or tables for this chapter
    for p_num, tabs in page_tables_map.items():
        for tab in tabs:
            tab_id = tab.get("id")
            if tab_id and tab_id not in rendered_table_ids:
                rendered_table_ids.add(tab_id)
                html_parts.append(tab.get("html", ""))

    for p_num, imgs in page_images_map.items():
        for img in imgs:
            url = img.get("url")
            if url and url not in rendered_image_urls and not img.get("is_inline", False):
                rendered_image_urls.add(url)
                html_parts.append(build_figure_card_html(img, p_num))

    return "\n".join(html_parts)


class StructureParser:
    def __init__(self, doc, pages: list):
        self.doc = doc
        self.pages = pages
        self.total_pages = len(pages)
        self.page_images_map = {
            p.page_number: getattr(p, "images", []) for p in self.pages
        }
        self.page_tables_map = {
            p.page_number: getattr(p, "tables", []) for p in self.pages
        }

    def _build_chapter_data(self, idx: int, title: str, start_p: int, end_p: int) -> dict:
        chapter_pages = [p for p in self.pages if start_p <= p.page_number <= end_p]
        chapter_text = "\n\n".join([f"--- Page {p.page_number} ---\n{p.text}" for p in chapter_pages])

        sub_images_map = {
            p.page_number: getattr(p, "images", [])
            for p in chapter_pages
            if getattr(p, "images", None)
        }

        sub_tables_map = {
            p.page_number: getattr(p, "tables", [])
            for p in chapter_pages
            if getattr(p, "tables", None)
        }

        formatted_html = format_text_to_rich_html(
            chapter_text,
            page_images_map=sub_images_map,
            page_tables_map=sub_tables_map
        )
        all_chapter_imgs = [img["url"] for p in chapter_pages for img in getattr(p, "images", []) if "url" in img]

        return {
            "chapter_number": idx + 1,
            "title": title,
            "description": f"Comprehensive educational coverage of {title} across pages {start_p} to {end_p}.",
            "start_page": start_p,
            "end_page": end_p,
            "content": chapter_text,
            "formatted_html": formatted_html,
            "images": all_chapter_imgs
        }

    def extract_chapters(self) -> list:
        """
        High-Accuracy Multi-Strategy Chapter Extractor:
        1. Academic Unit/Module/Chapter anchor detection with frontmatter & backmatter disambiguation.
        2. Native PDF TOC Outline matching.
        3. Heading Hierarchy & Font-Size Pattern Recognition.
        4. Proportional fallback with zero dropped pages.
        """
        unit_anchors = self._detect_academic_units()
        if unit_anchors and len(unit_anchors) >= 1:
            chapters = []
            first_unit_page = unit_anchors[0]["page"]

            # Front Matter
            if first_unit_page > 1:
                overview_end = first_unit_page - 1
                chapters.append(self._build_chapter_data(0, "Front Matter & Preliminary Pages", 1, overview_end))

            # Main Body Chapters
            last_body_end = first_unit_page
            for idx, u in enumerate(unit_anchors):
                start_p = u["page"]
                end_p = unit_anchors[idx + 1]["page"] - 1 if idx + 1 < len(unit_anchors) else self.total_pages
                if end_p < start_p:
                    end_p = start_p

                ch_title = f"{u['type']} {u['num']}: {u['title']}" if u.get("title") and not u['title'].startswith(u['type']) else f"{u['type']} {u['num']}"
                chapters.append(self._build_chapter_data(len(chapters), ch_title, start_p, end_p))
                last_body_end = max(last_body_end, end_p)

            # Check if there are unassigned back-matter pages (e.g. Answers or Index)
            if last_body_end < self.total_pages:
                bm_start = last_body_end + 1
                chapters.append(self._build_chapter_data(len(chapters), "Answers & Comprehensive Index", bm_start, self.total_pages))

            if len(chapters) >= 2 or (len(chapters) == 1 and self.total_pages < 15):
                return chapters

        # Native PDF Outline TOC
        native_toc = self.doc.get_toc() if hasattr(self.doc, "get_toc") else []
        if native_toc and len(native_toc) >= 2:
            level_1 = [item for item in native_toc if item[0] == 1] or native_toc
            chapters = []
            for idx, item in enumerate(level_1):
                lvl, title, start_p = item[0], item[1].strip(), item[2]
                if start_p < 1 or start_p > self.total_pages:
                    start_p = 1
                end_p = level_1[idx + 1][2] - 1 if idx + 1 < len(level_1) and level_1[idx + 1][2] > start_p else self.total_pages
                if end_p < start_p:
                    end_p = start_p

                chapters.append(self._build_chapter_data(len(chapters), title, start_p, end_p))

            if len(chapters) >= 2:
                return chapters

        # Prominent Headings
        heading_chapters = self._detect_prominent_headings()
        if heading_chapters and len(heading_chapters) >= 2:
            chapters = []
            for idx, h in enumerate(heading_chapters):
                start_p = h["page"]
                end_p = heading_chapters[idx + 1]["page"] - 1 if idx + 1 < len(heading_chapters) else self.total_pages
                if end_p < start_p:
                    end_p = start_p
                chapters.append(self._build_chapter_data(len(chapters), h["title"], start_p, end_p))
            if len(chapters) >= 2:
                return chapters

        # Fallback Chunking
        chapters = []
        chunk_size = max(1, min(25, self.total_pages // 5 or 1))
        num_chunks = (self.total_pages + chunk_size - 1) // chunk_size

        for idx in range(num_chunks):
            start_p = idx * chunk_size + 1
            end_p = min(self.total_pages, (idx + 1) * chunk_size)
            chapter_pages = [p for p in self.pages if start_p <= p.page_number <= end_p]

            title_cand = f"Unit {idx + 1} — Core Principles"
            if chapter_pages and chapter_pages[0].blocks:
                first_head = next((b["text"].split("\n")[0] for b in chapter_pages[0].blocks if b.get("is_heading")), None)
                if first_head and 4 < len(first_head) < 65:
                    title_cand = clean_unit_title(first_head)

            chapters.append(self._build_chapter_data(len(chapters), title_cand, start_p, end_p))

        return chapters

    def _detect_academic_units(self) -> List[Dict]:
        """
        Scans all pages and blocks for academic Unit/Module/Chapter markers,
        collecting both descriptive titles from TOC/syllabus and true body start pages.
        Disambiguates between chapter openers and back-matter answer keys.
        """
        hits_by_type = {}

        for p in self.pages:
            p_num = p.page_number
            for b_idx, b in enumerate(p.blocks):
                lines = [l.strip() for l in b["text"].split("\n") if l.strip()]
                for l_idx, line in enumerate(lines):
                    m = UNIT_REGEX.match(line)
                    if m:
                        u_type = m.group(1).capitalize()
                        num_val = parse_num_val(m.group(2))
                        if num_val is None:
                            continue

                        raw_title = m.group(3) or ""
                        if not raw_title:
                            for nl in lines[l_idx + 1 : l_idx + 4]:
                                if not UNIT_REGEX.match(nl) and len(nl) > 2:
                                    raw_title = nl
                                    break
                        if not raw_title and b_idx + 1 < len(p.blocks):
                            next_b_text = p.blocks[b_idx + 1]["text"].strip()
                            if not UNIT_REGEX.match(next_b_text) and len(next_b_text) > 2:
                                raw_title = next_b_text.split("\n")[0]

                        # Discard answer keys (e.g. "1. b.", "1. a and b.")
                        if re.search(r"^\s*[0-9]+\.\s+[a-z]", raw_title, re.I):
                            continue

                        clean_t = clean_unit_title(raw_title)
                        hits_by_type.setdefault(u_type, []).append({
                            "type": u_type,
                            "num": num_val,
                            "title": clean_t,
                            "page": p_num
                        })

        if not hits_by_type:
            return []

        def score_type(t):
            hits = hits_by_type[t]
            distinct_nums = set(h["num"] for h in hits)
            return len(distinct_nums)

        best_type = max(hits_by_type.keys(), key=score_type)
        hits = hits_by_type[best_type]

        by_unit = {}
        for h in hits:
            by_unit.setdefault(h["num"], []).append(h)

        unit_nums = sorted(by_unit.keys())

        # Discard TOC pages (pages with multiple unit hits in the first 15% of book)
        page_hits_count = {}
        for h in hits:
            page_hits_count[h["page"]] = page_hits_count.get(h["page"], 0) + 1

        toc_pages = {p for p, c in page_hits_count.items() if c >= 2 and p < min(20, self.total_pages * 0.2)}

        final_units = []
        for un in unit_nums:
            candidates = by_unit[un]
            non_toc = [c for c in candidates if c["page"] not in toc_pages]
            cands_to_use = non_toc if non_toc else candidates

            prev_p = final_units[-1]["page"] if final_units else 0
            valid = [c for c in cands_to_use if c["page"] > prev_p]
            if valid:
                # Pick earliest true body page
                best = valid[0]
                final_units.append(best)

        return final_units

    def _detect_prominent_headings(self) -> List[Dict]:
        """Detects prominent numbered headings like '1. Introduction', '2. Dynamic Modeling'."""
        headings = []
        for p in self.pages:
            for b in p.blocks:
                first_l = b.get("text", "").strip().split("\n")[0]
                m = NUMBERED_CHAPTER_REGEX.match(first_l)
                if m:
                    num_val = int(m.group(1))
                    title = clean_unit_title(m.group(2))
                    prev_num = headings[-1]["num"] if headings else 0
                    prev_p = headings[-1]["page"] if headings else 0
                    if num_val == prev_num + 1 and p.page_number > prev_p:
                        headings.append({
                            "type": "Chapter",
                            "num": num_val,
                            "title": title,
                            "page": p.page_number
                        })
        return headings
