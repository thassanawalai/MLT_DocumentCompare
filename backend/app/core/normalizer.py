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

    # Check for and remove lines with three or more hyphens
    # Added this block as per user request
    lines = cleaned.split('\n')
    processed_lines = []
    for line in lines:
        if re.search(r'-{3,}', line):  # Check for 3 or more hyphens
            processed_lines.append(line.replace('-', '')) # Remove all hyphens in the line
        else:
            processed_lines.append(line)
    cleaned = '\n'.join(processed_lines)
    # End of added block

    if '++++++' in cleaned:
        cleaned = cleaned.split('++++++')[0]

    cleaned = re.sub(r'([^\w\s])\1{2,}', ' ', cleaned)
    cleaned = re.sub(r'[*+]', '', cleaned)

    if commas_as_whitespace:
        cleaned = re.sub(r'\s*,\s*', ' ', cleaned)

    # ============================================================
    # WHITESPACE CLEANING
    # ไม่สนใจว่าต้นฉบับจะเว้นวรรคกี่ช่องหรือขึ้นบรรทัดใหม่
    # ============================================================

    # Handle zero-width spaces explicitly
    cleaned = cleaned.replace('\u200b', ' ')
    cleaned = cleaned.replace('\x03', ' ')
    cleaned = cleaned.replace(r'\x03', ' ')
    cleaned = cleaned.replace('\x04', ' ')
    cleaned = re.sub(r'\s+', ' ', cleaned)

    return cleaned.strip()
