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
                "image": None
            }

        page = doc[0]

        for field, config in template.items():

            try:

                anchor_text = config["anchor_text"]

                text_instances = page.search_for(anchor_text)

                if not text_instances:

                    logger.warning(
                        f"ไม่พบ Anchor '{anchor_text}'"
                    )

                    extracted_data[field] = {
                        "value": None,
                        "bbox": None
                    }

                    continue

                anchor_rect = text_instances[0]

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
                        "height": target_rect.height
                    }
                }

            except Exception as e:

                logger.error(f"{field} : {e}")

                extracted_data[field] = {
                    "value": None,
                    "bbox": None
                }

        pix = page.get_pixmap(dpi=150)

        img_base64 = base64.b64encode(
            pix.tobytes("png")
        ).decode("utf-8")

        doc.close()

    except Exception as e:

        logger.error(e)

        if "doc" in locals():
            doc.close()

        return {
            "data": {},
            "image": None
        }

    return {
        "data": extracted_data,
        "image": img_base64
    }