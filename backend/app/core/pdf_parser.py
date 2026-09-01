from typing import Dict, Any
import fitz
import logging
import base64
import re

from app.core.geometry import get_anchor_position

logger = logging.getLogger(__name__)


def _normalize_anchor_text(text: str) -> str:
    """Normalize whitespace and PDF control separators for anchor matching."""
    # Some PDFs encode visual spaces as control characters (for example \x04).
    # `search_for()` treats those characters literally, so use this only as a
    # fallback when its exact coordinate search cannot find an anchor.
    return re.sub(r"\s+", " ", "".join(
        " " if ord(char) < 32 else char
        for char in text
    )).strip()


def _find_anchor_from_words(page: fitz.Page, anchor_text: str) -> fitz.Rect | None:
    """Find an exact-case anchor after normalizing control-character separators."""
    normalized_anchor = _normalize_anchor_text(anchor_text)
    if not normalized_anchor:
        return None

    # Word coordinates retain the tight bounds needed to calculate the target
    # extraction rectangle, unlike searching the full page text.
    words_by_line: dict[tuple[int, int], list[tuple]] = {}
    for word in page.get_text("words", sort=True):
        words_by_line.setdefault((word[5], word[6]), []).append(word)

    for words in words_by_line.values():
        for start in range(len(words)):
            candidate = ""
            for end in range(start, len(words)):
                candidate = _normalize_anchor_text(
                    f"{candidate} {words[end][4]}" if candidate else words[end][4]
                )

                if candidate == normalized_anchor:
                    rect = fitz.Rect(words[start][:4])
                    for word in words[start + 1:end + 1]:
                        rect |= fitz.Rect(word[:4])
                    return rect

                # Adding more words cannot restore an exact match.
                if len(candidate) >= len(normalized_anchor):
                    break

    return None


def find_anchor_case_sensitive(page: fitz.Page, anchor_text: str) -> fitz.Rect | None:
    """
    ค้นหา anchor_text ด้วยการตรวจจับพิมเล็กพิมใหญ่อย่างถูกต้อง
    และใช้ Regex เพื่อเช็กไม่ให้จับคำที่เป็นส่วนหนึ่งของประโยคอื่น (เช่น "SAME AS CONSIGNEE")
    """
    try:
        all_instances = page.search_for(anchor_text)
        
        for rect in all_instances:
            check_rect = rect + fitz.Rect(-40, -2, 2, 2)
            extracted_text = page.get_text("text", clip=check_rect).strip()
            
            if anchor_text in extracted_text:

                prefix = extracted_text.split(anchor_text)[0].strip()

                if not re.search(r'[a-zA-Z0-9]', prefix):
                    logger.debug(f"Found strict case-sensitive match for '{anchor_text}' at {rect}")
                    return rect
                else:
                    logger.debug(f"Ignored '{anchor_text}' because it has prefix: '{prefix}'")

        fallback_rect = _find_anchor_from_words(page, anchor_text)
        if fallback_rect is not None:
            logger.debug(f"Found normalized match for '{anchor_text}' at {fallback_rect}")
            return fallback_rect

        return None
        
    except Exception as e:
        logger.error(f"Error in case-sensitive anchor search: {e}")
        return None


def extract_bl_with_hybrid_bbox(
    pdf_path: str,
    template: dict
) -> Dict[str, Any]:

    extracted_data = {}
    img_base64 = ""

    try:
        doc = fitz.open(pdf_path)

        if doc.page_count == 0:
            logger.error(f"ไม่พบหน้าเอกสารในไฟล์: {pdf_path}")
            return {
                "data": {},
                "image": None,
                "images": [],
                "page_count": 0,
            }

        for field, config in template.items():

            try:

                anchor_text = config["anchor_text"]

                # Templates describe a field once, but it may appear on any
                # page of a multi-page PDF.  Search pages in document order so
                # the first matching field is used consistently.
                page = None
                anchor_rect = None
                page_index = None
                for index, candidate_page in enumerate(doc):
                    # Use case-sensitive search
                    anchor_rect = find_anchor_case_sensitive(candidate_page, anchor_text)
                    if anchor_rect is not None:
                        page = candidate_page
                        page_index = index
                        break

                if page is None or anchor_rect is None:

                    logger.warning(
                        f"ไม่พบ Anchor '{anchor_text}'"
                    )

                    extracted_data[field] = {
                        "value": None,
                        "bbox": None
                    }

                    continue

                start_x, start_y = get_anchor_position(
                    anchor_rect,
                    config["anchor_point"]
                )

                start_x += config.get("offset_x", 0)
                start_y += config.get("offset_y", 0)

                target_rect = fitz.Rect(
                    start_x,
                    start_y,
                    start_x + config["width"],
                    start_y + config["height"]
                )

                raw_text = page.get_text(
                    "text",
                    clip=target_rect
                )

                extracted_data[field] = {
                    "value": raw_text.strip() if raw_text else None,
                    "bbox": {
                        "x": target_rect.x0,
                        "y": target_rect.y0,
                        "width": target_rect.width,
                        "height": target_rect.height,
                        "page": page_index,
                    }
                }

            except Exception as e:

                logger.error(f"{field} : {e}")

                extracted_data[field] = {
                    "value": None,
                    "bbox": None
                }

        # Return every page so a field found beyond page 1 can be inspected in
        # the UI.  Keep `image` as the first page for API compatibility.
        images_base64 = []
        for page in doc:
            pix = page.get_pixmap(dpi=150)
            images_base64.append(base64.b64encode(pix.tobytes("png")).decode("utf-8"))

        img_base64 = images_base64[0] if images_base64 else ""

        doc.close()

    except Exception as e:

        logger.error(e)

        if "doc" in locals():
            doc.close()

        return {
            "data": {},
            "image": None,
            "images": [],
            "page_count": 0,
        }

    return {
        "data": extracted_data,
        "image": img_base64,
        "images": images_base64,
        "page_count": len(images_base64),
    }
