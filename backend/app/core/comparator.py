import difflib
from app.core.normalizer import normalize_text

def _generate_structured_diff(text1: str, text2: str) -> tuple[list[dict], list[dict]]:
    """
    Compares two strings and returns a structured diff for UI rendering.

    Returns a tuple of two lists of dictionaries, one for each input string.
    Each dictionary contains a 'tag' ('equal', 'delete', 'insert') and a 'value'.
    """
    matcher = difflib.SequenceMatcher(None, text1, text2, autojunk=False)
    diff1, diff2 = [], []
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            diff1.append({'tag': 'equal', 'value': text1[i1:i2]})
            diff2.append({'tag': 'equal', 'value': text2[j1:j2]})
        else:
            if text1[i1:i2]:
                diff1.append({'tag': 'delete', 'value': text1[i1:i2]})
            if text2[j1:j2]:
                diff2.append({'tag': 'insert', 'value': text2[j1:j2]})
                
    return diff1, diff2

def _combine_shipper_fields(data: dict) -> dict:
    """
    ตรวจสอบและรวมฟิลด์ shipper_1 และ shipper_2 ให้เป็นฟิลด์ shipper เดียว
    พร้อมจัดลำดับให้อยู่ต่อจากฟิลด์ booking_no และคำนวณ Bbox ใหม่
    """
    if "shipper_1" in data or "shipper_2" in data:
        shipper1_obj = data.get("shipper_1", {})
        shipper2_obj = data.get("shipper_2", {})

        val1 = shipper1_obj.get("value", "") if isinstance(shipper1_obj, dict) else str(shipper1_obj)
        val2 = shipper2_obj.get("value", "") if isinstance(shipper2_obj, dict) else str(shipper2_obj)

        combined_value = f"{val1 or ''} {val2 or ''}".strip()

        bboxes = []
        bbox1 = shipper1_obj.get("bbox")
        if isinstance(bbox1, dict) and all(k in bbox1 for k in ['x', 'y', 'width', 'height']):
            bboxes.append(bbox1)
        elif isinstance(bbox1, list) and len(bbox1) == 4:
            bboxes.append({"x": bbox1[0], "y": bbox1[1], "width": bbox1[2]-bbox1[0], "height": bbox1[3]-bbox1[1]})

        bbox2 = shipper2_obj.get("bbox")
        if isinstance(bbox2, dict) and all(k in bbox2 for k in ['x', 'y', 'width', 'height']):
            bboxes.append(bbox2)
        elif isinstance(bbox2, list) and len(bbox2) == 4:
            bboxes.append({"x": bbox2[0], "y": bbox2[1], "width": bbox2[2]-bbox2[0], "height": bbox2[3]-bbox1[1]})

        shipper_payload = {"value": combined_value, "bbox": bboxes}

        new_data = {}
        for key, value in data.items():
            if key in ["shipper_1", "shipper_2"]:
                continue
            
            new_data[key] = value

            if key == "booking_no":
                new_data["shipper"] = shipper_payload
        
        if "shipper" not in new_data:
            temp_data_with_shipper = {"shipper": shipper_payload}
            temp_data_with_shipper.update(new_data)
            new_data = temp_data_with_shipper

        return new_data
        
    return data

def compare_data(original_data: dict, program_data: dict) -> tuple[dict, list]:
    """
    Compares original and program data, identifies discrepancies,
    and generates structured diffs for any mismatched fields.
    """
    original_data = _combine_shipper_fields(original_data)
    program_data = _combine_shipper_fields(program_data)

    discrepancies = []
    
    all_keys = list(original_data.keys()) 
    for k in program_data.keys():
        if k not in all_keys:
            all_keys.append(k)

    for key in all_keys:
        orig_obj = original_data.get(key, {})
        prog_obj = program_data.get(key, {})
        
        orig_val = orig_obj.get("value", "") if isinstance(orig_obj, dict) else str(orig_obj)
        prog_val = prog_obj.get("value", "") if isinstance(prog_obj, dict) else str(prog_obj)
        
        is_address_like_field = key in {
            "port_of_loading", "port_of_discharge", "consignee", "shipper", 
            "notify_party", "place_of_receipt", "place_of_delivery"
        }
        clean_orig = normalize_text(orig_val, commas_as_whitespace=is_address_like_field)
        clean_prog = normalize_text(prog_val, commas_as_whitespace=is_address_like_field)
        
        is_match = False
        if clean_orig == clean_prog:
            if not clean_orig: 
                is_raw_orig_empty = not str(orig_val or "").strip()
                is_raw_prog_empty = not str(prog_val or "").strip()
                is_match = is_raw_orig_empty and is_raw_prog_empty
            else:
                is_match = True
            
        if not is_match:
            diff_orig, diff_prog = _generate_structured_diff(clean_orig, clean_prog)
            
            discrepancies.append({
                "field": key,
                "original_value": {**orig_obj, "clean_value": clean_orig, "diff": diff_orig},
                "program_value": {**prog_obj, "clean_value": clean_prog, "diff": diff_prog}
            })
            
    return original_data, discrepancies
