from app.core.normalizer import normalize_text

def combine_shipper(original_data):
    # ดึงค่าออกมา ถ้าเป็น Dict ให้เจาะไปที่ "value" ถ้าไม่ใช่ให้คืนค่าเดิม (String)
    s1 = original_data.get("shipper_1", "")
    s2 = original_data.get("shipper_2", "")
    
    part1 = s1.get("value", "") if isinstance(s1, dict) else s1
    part2 = s2.get("value", "") if isinstance(s2, dict) else s2

    combined_val = f"{part1} {part2}".strip()

    new_data = {}
    for key, value in original_data.items():
        if key == "shipper_1":
            # สร้างโครงสร้างข้อมูลกลับเข้าไปตามแบบเดิม 
            # (ถ้าของเดิมมี bbox มันก็จะเก็บโครงสร้าง Dict ไว้ให้)
            if isinstance(s1, dict):
                new_data["shipper"] = {"value": combined_val, "bbox": s1.get("bbox", [])}
            else:
                new_data["shipper"] = combined_val
        elif key == "shipper_2":
            continue
        else:
            new_data[key] = value

    return new_data


def compare_data(original_data, program_data):
    original_data = combine_shipper(original_data)
    discrepancies = []

    print(f"\n{'='*60}")
    print("🔍 Start Compare")
    print(f"{'='*60}")

    for field in original_data.keys():
        # ดึงข้อมูลออกมารองรับทั้งแบบ Dict และ String
        orig_obj = original_data.get(field, "")
        prog_obj = program_data.get(field, "")

        orig_val = orig_obj.get("value", "") if isinstance(orig_obj, dict) else orig_obj
        prog_val = prog_obj.get("value", "") if isinstance(prog_obj, dict) else prog_obj

        # ส่งเฉพาะ String เข้าไป Normalizer
        cleaned_orig = normalize_text(orig_val)
        cleaned_prog = normalize_text(prog_val)

        match = cleaned_orig == cleaned_prog
        print(f"{field} : {'✅' if match else '❌'}")

        if not match:
            discrepancies.append({
                "field": field,
                "original_value": orig_val,
                "program_value": prog_val
            })

    # ส่ง original_data (ที่แปลง shipper แล้ว) และจุดที่ไม่ตรงกันกลับไป
    return original_data, discrepancies