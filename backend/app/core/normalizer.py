import re

def normalize_text(text: str | None) -> str:
    """
    ฟังก์ชันสำหรับทำความสะอาดและแปลงข้อมูลให้อยู่ในรูปแบบมาตรฐาน
    เพื่อใช้ในการเปรียบเทียบข้อมูลแบบ 100%
    """
    if not text:
        return ""
    
    cleaned = str(text)
    
    # 1. กฎอนุโลมเฉพาะคำ (Standardize specific words)
    cleaned = re.sub(r'\btel\b', 'TEL', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\bfax\b', 'FAX', cleaned, flags=re.IGNORECASE)
    # ลบคำนำหน้า Voyage Number (เช่น V. , V , VOY. , VOY)
    cleaned = re.sub(r'\b(V|VOY)\.?\s*', '', cleaned, flags=re.IGNORECASE)    
    
    # 2. จัดการตัวเลขและหน่วยวัด
    # 2.1 ลบ comma ที่เป็น thousand separator (เช่น 18,808 -> 18808)
    cleaned = re.sub(r'(?<=\d),(?=\d)', '', cleaned)
    
    # 2.2 ลบหน่วยวัดที่พบบ่อย (Weight/Measurement units)
    # ใช้ (?<![a-zA-Z]) (Negative Lookbehind) แทน \b เพื่อให้ลบหน่วยที่ติดกับตัวเลขได้ (เช่น 100KGS) 
    # แต่ยังคงป้องกันการลบกลางคำ (เช่น SOMECASESTUDY) ได้เหมือนเดิม
    cleaned = re.sub(r'(?<![a-zA-Z])(KGS|KGM|CBM|CASES|CASE)\b', '', cleaned, flags=re.IGNORECASE)
    
    # --- แปลงรูปแบบตัวเลขให้เป็นมาตรฐาน (แก้ปัญหา '123.450' vs '123.45') ---
    try:
        float_value = float(cleaned.strip())
        if float_value.is_integer():
            cleaned = str(int(float_value))
        else:
            cleaned = str(float_value)
    except (ValueError, TypeError):
        pass
    
    # 3. ลบอักขระพิเศษที่ไม่ต้องการ (เช่น * และ +)
    # New rule: If "++++++" is found, remove "++++++" and everything after it.
    if '++++++' in cleaned:
        cleaned = cleaned.split('++++++')[0]
    
    cleaned = re.sub(r'[*+]', '', cleaned)
    # 4. จัดการ Whitespace ให้เคาะบรรทัดหรือช่องว่างหลายๆ ตัวเหลือเพียง Space เดียว
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # 5. ลบช่องว่างส่วนเกินที่หัวและท้ายข้อความ
    return cleaned.strip()