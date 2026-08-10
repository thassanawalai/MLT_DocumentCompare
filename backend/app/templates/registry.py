import importlib
import logging

logger = logging.getLogger(__name__)

_template_map = {
    "OOCL": "app.templates.OOCL_template",
    "MCKEY": "app.templates.MCKEY_template",
    "BFOODS_1": "app.templates.BFOODS_1_template",  # Template ภายในสำหรับไฟล์ฝั่งโปรแกรม
    "BFOODS_2": "app.templates.BFOODS_2_template",
    "BFOODS_3": "app.templates.BFOODS_3_template",
    "AJIMOMOTO": "app.templates.AJIMOMOTO_template",
    "SIAMCHAI": "app.templates.SIAMCHAI_template",
    "SURAPON": "app.templates.SURAPON_template",
    "POLYPLEX": "app.templates.POLYPLEX_template",
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
