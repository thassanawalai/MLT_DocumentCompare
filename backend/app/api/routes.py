import io
import pandas as pd
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.process_service import process_pdf
from app.templates.registry import _template_map

router = APIRouter()

@router.get("/templates")
def get_templates():
    """ส่งรายชื่อเทมเพลตที่มีทั้งหมดกลับไป"""
    return {"templates": list(_template_map.keys())}

@router.post("/process-pdf")
async def compare_pdfs( 
    company_original: Optional[str] = Form("OOCL"), 
    company_program: str = Form("MCKEY"),
    file_original: Optional[UploadFile] = File(None), 
    file_program: UploadFile = File(...)
):
    try:
        filename = file_program.filename.lower()

        # ==========================================
        # 1. ดักจับกรณีเป็นไฟล์ EXCEL หรือ CSV
        # ==========================================
        if filename.endswith((".xlsx", ".xls", ".csv")):
            # อ่านเนื้อหาไฟล์เข้ามา
            contents = await file_program.read()
            
            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(contents))
            else:
                df = pd.read_excel(io.BytesIO(contents))
            
            if df.empty:
                raise HTTPException(status_code=400, detail="ไฟล์ Excel ไม่มีข้อมูล")
            
            # ดึงข้อมูลจาก Row แรกสุด (Index 0)
            row = df.iloc[0].fillna("")
            
            extracted_data = {
                "booking_no": {"value": str(row.get("BOOKING NO.", ""))},
                "shipper": {"value": str(row.get("SHIPPER", ""))},
                "consignee": {"value": str(row.get("CONSIGNEE", ""))},
                "notify_party": {"value": str(row.get("NOTIFY PARTY", ""))},
                "feeder": {"value": f"{row.get('FEEDER', '')} {row.get('VOID NO.', '')}".strip()},
                "vessel": {"value": f"{row.get('VESSEL', '')} {row.get('VOID NO..1', '')}".strip()},
                "port_of_loading": {"value": str(row.get("PORT OF LOADING", ""))},
                "port_of_discharge": {"value": str(row.get("PORT OF DISCHARGE", ""))},
                "place_of_delivery": {"value": str(row.get("PORT OR DELIVERY", ""))},
                "place_of_receipt": {"value": ""},
                "mark": {"value": str(row.get("MARKS", ""))},
                "description": {"value": str(row.get("DESCRIPTION", ""))},
                "quantity": {"value": str(row.get(" QTY ", ""))},
                "gross_weight": {"value": str(row.get(" G.W. ", ""))},
                "measurement": {"value": str(row.get(" CBM ", ""))}
            }

            # ส่งกลับไปให้หน้าบ้าน (ไม่ต้องมี bbox และ image เพราะ Excel ไม่มีภาพ)
            return {
                "status": "success",
                "program": {
                    "data": extracted_data,
                    "image": None 
                }
            }

        # ==========================================
        # 2. กรณีเป็นไฟล์ PDF (โยนให้ Service เดิมจัดการ)
        # ==========================================
        else:
            result = process_pdf(
                company_original=company_original,
                company_program=company_program,
                file_original=file_original,
                file_program=file_program
            )
            return result
            
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))