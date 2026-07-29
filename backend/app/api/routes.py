from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.process_service import process_pdf

router = APIRouter()

@router.post("/process-pdf")
def compare_pdfs(
    company: str = Form(...),
    file_original: UploadFile = File(...),  # <--- ตรวจสอบตรงนี้ว่าประกาศชื่อ file_original ไว้แล้วหรือยัง
    file_program: UploadFile = File(...)    # <--- ตรวจสอบตรงนี้ว่าประกาศชื่อ file_program ไว้แล้วหรือยัง
):
    try:
        result = process_pdf(
            company=company, 
            file_original=file_original, 
            file_program=file_program
        )
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))