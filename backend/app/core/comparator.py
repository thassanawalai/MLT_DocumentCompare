from app.core.normalizer import normalize_text

def _combine_shipper_fields(data: dict) -> dict:
    """
    ตรวจสอบและรวมฟิลด์ shipper_1 และ shipper_2 ให้เป็นฟิลด์ shipper เดียว
    พร้อมจัดลำดับให้อยู่ต่อจากฟิลด์ booking_no และคำนวณ Bbox ใหม่
    """
    # ตรวจสอบว่ามีฟิลด์ shipper_1 หรือ shipper_2 อย่างน้อยหนึ่งฟิลด์
    if "shipper_1" in data or "shipper_2" in data:
        print("INFO: Combining 'shipper_1' and 'shipper_2' into a single 'shipper' field.")
        
        shipper1_obj = data.get("shipper_1", {})
        shipper2_obj = data.get("shipper_2", {})

        # ดึง value ดิบออกมา
        val1 = shipper1_obj.get("value", "") if isinstance(shipper1_obj, dict) else str(shipper1_obj)
        val2 = shipper2_obj.get("value", "") if isinstance(shipper2_obj, dict) else str(shipper2_obj)

        combined_value = f"{val1 or ''} {val2 or ''}".strip() # รวมข้อความดิบเข้าด้วยกัน

        # --- เก็บ Bounding Box ของแต่ละส่วนแยกกันเป็น List ---
        bboxes = []
        bbox1 = shipper1_obj.get("bbox")
        # ตรวจสอบว่า bbox1 เป็น dict หรือไม่ ก่อนที่จะ append
        if isinstance(bbox1, dict) and all(k in bbox1 for k in ['x', 'y', 'width', 'height']):
            bboxes.append(bbox1)
        # ถ้า bbox1 เป็น list (กรณีที่เคยรวมมาแล้ว) ให้ใช้ค่าแรก
        elif isinstance(bbox1, list) and len(bbox1) == 4:
            bboxes.append({"x": bbox1[0], "y": bbox1[1], "width": bbox1[2]-bbox1[0], "height": bbox1[3]-bbox1[1]})

        bbox2 = shipper2_obj.get("bbox")
        # ตรวจสอบว่า bbox2 เป็น dict หรือไม่ ก่อนที่จะ append
        if isinstance(bbox2, dict) and all(k in bbox2 for k in ['x', 'y', 'width', 'height']):
            bboxes.append(bbox2)
        elif isinstance(bbox2, list) and len(bbox2) == 4:
            bboxes.append({"x": bbox2[0], "y": bbox2[1], "width": bbox2[2]-bbox2[0], "height": bbox2[3]-bbox2[1]})

        # สร้าง object ใหม่สำหรับ shipper ที่รวมแล้ว
        # เปลี่ยน bbox ให้เป็น list เพื่อให้ frontend วาดไฮไลต์ได้หลายกล่อง
        shipper_payload = {"value": combined_value, "bbox": bboxes}

        new_data = {}
        for key, value in data.items():
            # ข้าม key เก่าไปเลย ไม่ต้องนำเข้า Dictionary ใหม่
            if key in ["shipper_1", "shipper_2"]:
                continue
            
            # นำข้อมูลเดิมใส่เข้าไปตามปกติ
            new_data[key] = value

            # เมื่อถึงคิวของ booking_no ให้แทรก shipper ตามเข้าไปทันที
            if key == "booking_no":
                new_data["shipper"] = shipper_payload
        
        # Fallback: กรณีที่เอกสารนี้ไม่มีฟิลด์ booking_no หรือ shipper ยังไม่ถูกเพิ่ม
        # ให้เพิ่ม shipper เข้าไปในตำแหน่งที่เหมาะสม (เช่น ท้ายสุด)
        if "shipper" not in new_data:
            # เพื่อให้ shipper อยู่ในลำดับที่เหมาะสม (เช่น หลัง booking_no หรือท้ายสุด)
            temp_data_with_shipper = {"shipper": shipper_payload}
            temp_data_with_shipper.update(new_data)
            new_data = temp_data_with_shipper

        return new_data
        
    return data

def compare_data(original_data, program_data):
    # --- ขั้นตอนพิเศษ: จัดการฟิลด์ shipper ที่อาจแยกกันในบาง template ---
    # เรียกใช้การรวมข้อมูลให้กับทั้งสองฝั่ง เพื่อให้โครงสร้าง JSON ที่จะส่งกลับมีรูปแบบเดียวกัน
    original_data = _combine_shipper_fields(original_data)
    program_data = _combine_shipper_fields(program_data)

    discrepancies = []
    
    # --- ปรับปรุง: ใช้ key ทั้งหมดจากทั้งสองฝั่ง และรักษาลำดับตาม original_data เป็นหลัก ---
    # สร้าง set ของ key ทั้งหมดเพื่อไม่ให้มี key ซ้ำกัน
    all_keys = list(original_data.keys()) 
    for k in program_data.keys():
        if k not in all_keys:
            all_keys.append(k)

    for key in all_keys:
        orig_obj = original_data.get(key, {})
        prog_obj = program_data.get(key, {})
        
        # ดึง value ออกมา (รองรับทั้งแบบที่เป็น dict และ string)
        orig_val = orig_obj.get("value", "") if isinstance(orig_obj, dict) else str(orig_obj)
        prog_val = prog_obj.get("value", "") if isinstance(prog_obj, dict) else str(prog_obj)
        
        # ผ่านฟังก์ชัน normalizer 
        is_port_field = key in {"port_of_loading", "port_of_discharge"}
        clean_orig = normalize_text(orig_val, commas_as_whitespace=is_port_field)
        clean_prog = normalize_text(prog_val, commas_as_whitespace=is_port_field)
        
        # --- ตรรกะการเปรียบเทียบแบบเข้มงวด 100% ---
        is_match = False

        if clean_orig == clean_prog: # ต้องตรงกัน 100%
            if not clean_orig: 
                is_raw_orig_empty = not str(orig_val or "").strip()
                is_raw_prog_empty = not str(prog_val or "").strip()
                is_match = is_raw_orig_empty and is_raw_prog_empty
            else:
                is_match = True
            
        print("-----------------------------------------")
        print(f"Field: {key}")
        print(f"  - Original (raw) : '{orig_val}'")
        print(f"  - Program (raw)  : '{prog_val}'")
        print("  ---- After Normalization ----")
        print(f"  - Original (clean): '{clean_orig}'")
        print(f"  - Program (clean) : '{clean_prog}'")
        print(f"  => Result: {'✅ MATCH' if is_match else '❌ MISMATCH'}")
            
        if not is_match:
            discrepancies.append({
                "field": key,
                "original_value": orig_obj, # แก้ไข: ใช้ orig_obj ที่ถูกต้อง
                "program_value": prog_obj    # แก้ไข: ใช้ prog_obj ที่ถูกต้อง
            })
            
    print("-----------------------------------------")
    return original_data, discrepancies
