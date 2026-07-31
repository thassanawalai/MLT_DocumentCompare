import re

def normalize_text(text: str) -> str:
    """
    ฟังก์ชันทำความสะอาดข้อมูล (Case-Sensitive)
    พร้อมตั้งกฎยกเว้น (Exception) ให้แปลงเฉพาะคำว่า TEL และ FAX เป็นมาตรฐานเดียวกัน
    """
    if not text:
        return ""
    
    cleaned = str(text)
    
    # 1. กฎอนุโลมเฉพาะคำ (Standardize specific words)
    # (?i) คือการสั่งให้ Regex มองข้ามตัวพิมพ์เล็ก-ใหญ่ (Ignore Case)
    # \b คือ Word Boundary ป้องกันการไปแปลงคำอื่นที่มีอักษรติดกัน (เช่น ไม่ให้เปลี่ยน hoTEL)
    cleaned = re.sub(r'(?i)\btel\b', 'TEL', cleaned)
    cleaned = re.sub(r'(?i)\bfax\b', 'FAX', cleaned)
    # ลบคำนำหน้า Voyage Number (เช่น V. , V , VOY. , VOY)
    cleaned = re.sub(r'\b(V|VOY)\.?\s*', '', cleaned, flags=re.IGNORECASE)    
    
    # 2. จัดการตัวเลขและหน่วยวัด
    # 2.1 ลบ comma ที่เป็น thousand separator (เช่น 18,808 -> 18808)
    # ใช้ lookbehind (?<=\d) และ lookahead (?=\d) เพื่อให้แน่ใจว่า comma อยู่ระหว่างตัวเลข
    cleaned = re.sub(r'(?<=\d),(?=\d)', '', cleaned)
    
    # 2.2 ลบหน่วยวัดที่พบบ่อย (Weight/Measurement units)
    # \b คือ word boundary, i คือ ignore case
    cleaned = re.sub(r'\b(KGS|KGM|CBM|CASES|CASE)\b', '', cleaned, flags=re.IGNORECASE)
    
    # 3. ลบอักขระพิเศษที่ไม่ต้องการ (เช่น * และ +)
    cleaned = re.sub(r'[*+]', '', cleaned)
    # 4. จัดการ Whitespace ให้เคาะบรรทัดหรือช่องว่างหลายๆ ตัวเหลือเพียง Space เดียว
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # 5. ลบช่องว่างส่วนเกินที่หัวและท้ายข้อความ
    return cleaned.strip()