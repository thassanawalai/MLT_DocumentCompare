import re
import unicodedata


def normalize_text(
    text: str | None,
    *,
    commas_as_whitespace: bool = False
) -> str:
    """
    Normalize โดยสนใจเฉพาะเรื่อง whitespace
    ไม่ปรับแต่งข้อมูลส่วนอื่น
    """

    if not text:
        return ""

    # ใช้ OCR เดิม
    cleaned = str(text)

    # ============================================================
    # 3. ลบอักขระพิเศษ
    # ============================================================

    if '++++++' in cleaned:
        cleaned = cleaned.split('++++++')[0]

    cleaned = re.sub(r'([^\w\s])\1{2,}', ' ', cleaned)
    cleaned = re.sub(r'[*+]', '', cleaned)

    if commas_as_whitespace:
        cleaned = re.sub(r'\s*,\s*', ', ', cleaned)

    # ============================================================
    # WHITESPACE CLEANING
    # ไม่สนใจว่าต้นฉบับจะเว้นวรรคกี่ช่องหรือขึ้นบรรทัดใหม่
    # ============================================================

    cleaned = re.sub(r'\s+', ' ', cleaned)

    return cleaned.strip()