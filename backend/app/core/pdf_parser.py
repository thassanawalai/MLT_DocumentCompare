from typing import Dict, Any
import fitz
import logging
import base64

logger = logging.getLogger(__name__)

def extract_bl_with_hybrid_bbox(pdf_path: str, template: dict) -> Dict[str, Any]:
    """
    ฟังก์ชันสกัดข้อมูลจาก PDF โดยใช้เทคนิค Anchor-based ผสมกับ Relative BBox
    พร้อมระบบ Error Handling และการส่งคืนข้อมูลพิกัด (BBox) สำหรับทำ Auto-Zoom บน Frontend
    """
    extracted_data = {}
    img_base64 = ""
    
    try:
        doc = fitz.open(pdf_path)
        if doc.page_count == 0:
            logger.error(f"ไม่พบหน้าเอกสารในไฟล์: {pdf_path}")
            return {"data": extracted_data, "image": None}
            
        page = doc[0] 
        
        for field, config in template.items():
            anchor_text = config.get("anchor_text")
            direction = config.get("direction")
            w_offset = config.get("width_offset", 0)
            h_offset = config.get("height_offset", 0)
            x_shift = config.get("x_shift_left", 0)
            y_shift = config.get("y_shift_down", 0)
            y_shift_up = config.get("y_shift_up", 0)
            
            try:
                text_instances = page.search_for(anchor_text)
                
                if text_instances:
                    inst = text_instances[0] 
                    anchor_x0, anchor_y0, anchor_x1, anchor_y1 = inst
                    
                    if direction == "right":
                        # FIX 1: เพิ่ม adjusted_x0 ตรงนี้ก่อนเรียกใช้
                        adjusted_x0 = anchor_x0 - x_shift
                        start_y = anchor_y1 + y_shift

                        target_rect = fitz.Rect(
                            adjusted_x0,
                            start_y,
                            adjusted_x0 + w_offset,
                            start_y + h_offset
                        )
                    elif direction == "bottom":
                        adjusted_x0 = anchor_x0 - x_shift
                        target_rect = fitz.Rect(
                            adjusted_x0, 
                            anchor_y1, 
                            adjusted_x0 + w_offset, 
                            anchor_y1 + h_offset
                        )
                    else:
                        target_rect = inst
                        
                    # Step 3: สกัดข้อความและจัดเก็บข้อมูลพิกัด (BBox)
                    raw_text = page.get_text("text", clip=target_rect)
                    
                    extracted_data[field] = {
                        "value": raw_text.strip() if raw_text else None,
                        "bbox": {
                            "x": target_rect.x0,
                            "y": target_rect.y0,
                            "width": target_rect.width,
                            "height": target_rect.height
                        }
                    }
                    
                else:
                    logger.warning(f"ไม่พบ Anchor Text '{anchor_text}' สำหรับฟิลด์ '{field}'")
                    extracted_data[field] = {"value": None, "bbox": None} 
                    
            except Exception as e:
                logger.error(f"เกิดข้อผิดพลาดในการดึงข้อมูลฟิลด์ '{field}': {str(e)}")
                extracted_data[field] = {"value": None, "bbox": None}

        # FIX 2: ย้ายการแคปรูป (Pixmap) มาไว้ตรงนี้ ก่อนที่จะทำการ close()
        pix = page.get_pixmap(dpi=150)
        img_base64 = base64.b64encode(pix.tobytes("png")).decode("utf-8")
        
        # ปิดไฟล์แค่ครั้งเดียวเมื่อประมวลผลทุกอย่างเสร็จแล้ว
        doc.close()
        
    except fitz.FileDataError:
        logger.error(f"ไฟล์ PDF เสียหาย หรือไม่รองรับฟอร์แมต: {pdf_path}")
    except Exception as e:
        logger.error(f"เกิดข้อผิดพลาดที่ไม่คาดคิดในการประมวลผลไฟล์ {pdf_path}: {str(e)}")
        # ถ้าพังระดับไฟล์ ให้พยายามปิด doc ถ้ามันถูกเปิดไว้แล้ว
        if 'doc' in locals():
            doc.close()

    return {
        "data": extracted_data,
        "image": img_base64
    }