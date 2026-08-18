from typing import Dict, Any
import fitz
import logging
import base64

from app.core.geometry import get_anchor_position

logger = logging.getLogger(__name__)


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
                    text_instances = candidate_page.search_for(anchor_text)
                    if text_instances:
                        page = candidate_page
                        anchor_rect = text_instances[0]
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
