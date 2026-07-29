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
    
    # 2. ลบอักขระพิเศษที่ไม่ต้องการ (เช่น * และ +)
    cleaned = re.sub(r'[*+]', '', cleaned)
    
    # 3. จัดการ Whitespace ให้เคาะบรรทัดหรือช่องว่างหลายๆ ตัวเหลือเพียง Space เดียว
    cleaned = re.sub(r'\s+', ' ', cleaned)
    
    # 4. ลบช่องว่างส่วนเกินที่หัวและท้ายข้อความ
    return cleaned.strip()