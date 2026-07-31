import importlib
import logging

logger = logging.getLogger(__name__)

def get_template(template_name: str) -> dict:
    """
    โหลด Template อัตโนมัติตามชื่อบริษัท
    เช่น ถ้า template_name = "OOCL" ระบบจะไปดึงจาก app.templates.OOCL_template
    รองรับการจัดการชื่อที่มีจุดหรือช่องว่าง (เช่น "B.FOODS" จะถูกแปลงเป็น "B_FOODS")
    """
    if not template_name:
        logger.error("Error: ไม่ได้ระบุชื่อ Template (template_name is empty)")
        return None

    try:
        # คลีนชื่อบริษัท: แปลงจุด (.) ช่องว่าง ( ) หรือขีด (-) ให้เป็น Underscore (_) 
        # และทำให้เป็นตัวพิมพ์ใหญ่ทั้งหมด
        clean_name = template_name.replace(".", "_").replace(" ", "_").replace("-", "_").upper()
        
        # นำชื่อที่คลีนแล้วมาต่อท้ายด้วย _template
        module_name = f"app.templates.{clean_name}_template"
        
        # ทำ Dynamic Import
        module = importlib.import_module(module_name)
        
        # คืนค่าตัวแปร TEMPLATE ที่อยู่ในไฟล์นั้น
        return getattr(module, 'TEMPLATE', None)
        
    except ImportError:
        logger.error(f"ImportError: ไม่พบไฟล์ Template สำหรับ '{template_name}' (หาโมดูล {module_name} ไม่เจอ)")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading template '{template_name}': {str(e)}")
        return None