import os
import shutil

from fastapi import HTTPException

from app.core.pdf_parser import extract_bl_with_hybrid_bbox
from app.core.comparator import compare_data
from app.templates.registry import get_template

def process_pdf(company: str, file_original, file_program):
    """
    ฟังก์ชันหลักสำหรับรับไฟล์ เซฟลง Temp, สกัดข้อมูล และเปรียบเทียบ
    """
    
    # 1. โหลด Template แบบ Dynamic ผ่าน registry
    template = get_template(company)
    program_template = get_template("PROGRAM")

    # 2. ตรวจสอบว่ามี Template รองรับหรือไม่
    if not template:
        raise HTTPException(status_code=400, detail=f"Unknown company: {company}")
    if not program_template:
        raise HTTPException(status_code=500, detail="Program template not found in registry.")

    # 3. ตรวจสอบนามสกุลไฟล์
    if not file_original.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Original file must be PDF.")
    if not file_program.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Program file must be PDF.")

    # 4. กำหนดชื่อ Temp Path
    temp_orig_path = f"temp_orig_{file_original.filename}"
    temp_prog_path = f"temp_prog_{file_program.filename}"

    try:
        # 5. บันทึกไฟล์ลงชั่วคราว
        with open(temp_orig_path, "wb") as buffer:
            shutil.copyfileobj(file_original.file, buffer)

        with open(temp_prog_path, "wb") as buffer:
            shutil.copyfileobj(file_program.file, buffer)

        # 6. สกัดข้อมูลโดยใช้ Template ที่โหลดมา
        orig_result = extract_bl_with_hybrid_bbox(
            temp_orig_path,
            template
        )

        prog_result = extract_bl_with_hybrid_bbox(
            temp_prog_path,
            program_template
        )

        orig_data = orig_result["data"]
        prog_data = prog_result["data"]

        # 7. เปรียบเทียบข้อมูล
        orig_data, discrepancies = compare_data(
            orig_data,
            prog_data
        )

        # 8. ส่งผลลัพธ์กลับ
        return {
            "status": "success",
            "original": {
                "data": orig_data,
                "image": orig_result["image"],
            },
            "program": {
                "data": prog_data,
                "image": prog_result["image"],
            },
            "discrepancies": discrepancies,
        }

    finally:
        # 9. ลบ Temp File เสมอไม่ว่าจะเกิด Error หรือไม่
        if os.path.exists(temp_orig_path):
            os.remove(temp_orig_path)
        if os.path.exists(temp_prog_path):
            os.remove(temp_prog_path)