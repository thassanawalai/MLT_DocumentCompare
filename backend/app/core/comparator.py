from app.core.normalizer import normalize_text

def compare_data(original_data, program_data):
    discrepancies = []
    
    for key in original_data.keys():
        orig_obj = original_data.get(key, {})
        prog_obj = program_data.get(key, {})
        
        # ดึง value ออกมา (รองรับทั้งแบบที่เป็น dict และ string)
        orig_val = orig_obj.get("value", "") if isinstance(orig_obj, dict) else str(orig_obj)
        prog_val = prog_obj.get("value", "") if isinstance(prog_obj, dict) else str(prog_obj)
        
        # ผ่านฟังก์ชัน normalizer ที่แกมีอยู่แล้ว
        clean_orig = normalize_text(orig_val)
        clean_prog = normalize_text(prog_val)
        
        # 🌟 ปรับตรงนี้: ถ้าข้อความฝั่งใดฝั่งหนึ่ง เป็นส่วนหนึ่งของอีกฝั่ง (แก้ปัญหาข้อความยาวไม่เท่ากัน)
        # หรือถ้าความเหมือนผ่านเกณฑ์ ให้ถือว่า Match!
        is_match = False
        if clean_orig == clean_prog:
            is_match = True
        elif clean_orig in clean_prog or clean_prog in clean_orig:
            # อนุโลมให้ผ่าน ถ้าข้อความอีกฝั่งมันยาวกว่า (เช่น มีที่อยู่หรือจังหวัดแถมมา)
            is_match = True
            
        if not is_match:
            discrepancies.append({
                "field": key,
                "original_value": orig_obj,
                "program_value": prog_obj
            })
            
    return original_data, discrepancies