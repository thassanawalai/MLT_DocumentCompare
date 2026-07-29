import importlib
import logging

logger = logging.getLogger(__name__)

def get_template(template_name: str) -> dict:
    """
    โหลด Template อัตโนมัติตามชื่อบริษัท
    เช่น ถ้า template_name = "OOCL" ระบบจะไปดึงจาก app.templates.OOCL_template
    """
    try:
        # นำชื่อบริษัทมาทำเป็นตัวพิมพ์ใหญ่ และต่อท้ายด้วย _template
        module_name = f"app.templates.{template_name.upper()}_template"
        
        # ทำ Dynamic Import
        module = importlib.import_module(module_name)
        
        # คืนค่าตัวแปร TEMPLATE ที่อยู่ในไฟล์นั้น
        return module.TEMPLATE
        
    except ImportError:
        logger.error(f"ImportError: ไม่พบไฟล์ Template สำหรับ '{template_name}' (หาโมดูล {module_name} ไม่เจอ)")
        return None
    except AttributeError:
        logger.error(f"AttributeError: พบไฟล์ {module_name}.py แต่ไม่มีการประกาศตัวแปรชื่อ 'TEMPLATE' ไว้ข้างใน")
        return None