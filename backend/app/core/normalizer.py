import re
import unicodedata

def normalize_text(text: str | None, *, commas_as_whitespace: bool = False) -> str:
    """
    ฟังก์ชันสำหรับทำความสะอาดและแปลงข้อมูลให้อยู่ในรูปแบบมาตรฐาน
    เพื่อใช้ในการเปรียบเทียบข้อมูลแบบ 100%
    """
    if not text:
        return ""
    
    # Normalize Unicode first so non-breaking/full-width spaces cannot bypass
    # the whitespace rule. Remove invisible zero-width characters as well.
    cleaned = unicodedata.normalize("NFKC", str(text))
    cleaned = re.sub(r"[\u200B-\u200D\uFEFF]", "", cleaned)
    
    # 1. กฎอนุโลมเฉพาะคำ (Standardize specific words)
    cleaned = re.sub(r'\btel\b', 'TEL', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bfax\b', 'FAX', cleaned, flags=re.IGNORECASE)
    # ลบคำนำหน้า Voyage Number (เช่น V. , V , VOY. , VOY)
    cleaned = re.sub(r'\b(V|VOY)\.?\s*', '', cleaned, flags=re.IGNORECASE)    
    # New rule: Remove "TOTAL:" from mark fields
    cleaned = re.sub(r'\bTOTAL:\s*', '', cleaned, flags=re.IGNORECASE)
    
    # 2. จัดการตัวเลขและหน่วยวัด
    # 2.1 ลบ comma ที่เป็น thousand separator (เช่น 18,808 -> 18808)
    cleaned = re.sub(r'(?<=\d),(?=\d)', '', cleaned)
    
    # 2.2 ทำให้หน่วย M3 และ CBM เป็นมาตรฐานเดียวกัน (convert M3 to CBM)
    cleaned = re.sub(r'\bM3\b', 'CBM', cleaned, flags=re.IGNORECASE)

    # 2.3 ลบหน่วยวัดที่พบบ่อย (Weight/Measurement units)
    # ใช้ (?<![a-zA-Z]) (Negative Lookbehind) แทน \b เพื่อให้ลบหน่วยที่ติดกับตัวเลขได้ (เช่น 100KGS) 
    # แต่ยังคงป้องกันการลบกลางคำ (เช่น SOMECASESTUDY) ได้เหมือนเดิม
    cleaned = re.sub(r'(?<![a-zA-Z])(KGS|KGM|CBM|CASES|CASE)\b', '', cleaned, flags=re.IGNORECASE)
    
    # --- แปลงรูปแบบตัวเลขให้เป็นมาตรฐาน (แก้ปัญหา '123.450' vs '123.45', และปัดทศนิยม) ---
    try:
        float_value = float(cleaned.strip())
        # ปัดทศนิยมเป็น 2 ตำแหน่งตามที่ผู้ใช้ต้องการ
        rounded_value = round(float_value, 3)
        # แปลงกลับเป็น string โดยถ้าเป็นจำนวนเต็มก็ไม่ต้องมี .00
        if rounded_value == int(rounded_value):
            cleaned = str(int(rounded_value))
        else:
            cleaned = str(rounded_value)
    except (ValueError, TypeError):
        pass
    
    # 3. ลบอักขระพิเศษที่ไม่ต้องการ (เช่น * และ +)
    # New rule: If "++++++" is found, remove "++++++" and everything after it.
    if '++++++' in cleaned:
        cleaned = cleaned.split('++++++')[0]
    
    # Decorative OCR noise such as "---", "...", or "***" has no data
    # value. Replace only runs of the *same* symbol (3+) with a space, rather
    # than deleting them, so text on either side cannot be accidentally merged.
    # Ordinary identifiers such as "AB-123/45" are left unchanged.
    cleaned = re.sub(r'([^\w\s])\1{2,}', ' ', cleaned)
    cleaned = re.sub(r'[*+]', '', cleaned)
    # Commas separate city and country in port fields. Keep this opt-in so
    # punctuation in reference numbers and other fields remains significant.
    if commas_as_whitespace:
        # Standardize spacing around commas: no space before, one space after.
        # This makes "A,B", "A, B", "A ,B" all become "A, B".
        cleaned = re.sub(r'\s*,\s*', ', ', cleaned)
    # 4. จัดการ Whitespace ให้เคาะบรรทัดหรือช่องว่างหลายๆ ตัวเหลือเพียง Space เดียว
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # 5. ลบช่องว่างส่วนเกินที่หัวและท้ายข้อความ
    return cleaned.strip()
