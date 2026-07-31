import importlib
import logging

logger = logging.getLogger(__name__)

_template_map = {
    "OOCL": "app.templates.OOCL_template",
    "B_FOODS": "app.templates.BFOOD_template",
    "PROGRAM": "app.templates.PROGRAM_template",  # Template ภายในสำหรับไฟล์ฝั่งโปรแกรม
}

def get_template(company_name: str) -> dict | None:
    """
    โหลด Template ของบริษัทที่ระบุแบบ Dynamic
    """
    module_name = _template_map.get(company_name.upper())
    if not module_name:
        return None
    try:
        template_module = importlib.import_module(module_name)
        return getattr(template_module, "TEMPLATE", {})
    except ImportError:
        logger.error(f"ไม่สามารถโหลด Template module '{module_name}' ได้")
        return None