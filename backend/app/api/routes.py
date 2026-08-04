from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.services.process_service import process_pdf
from app.templates.registry import _template_map

router = APIRouter()

@router.get("/templates")
def get_templates():
    """ส่งรายชื่อเทมเพลตที่มีทั้งหมดกลับไป"""
    return {"templates": list(_template_map.keys())}

@router.post("/process-pdf")
def compare_pdfs(
    company_original: str = Form(...),
    company_program: str = Form(...),
    file_original: UploadFile = File(...),
    file_program: UploadFile = File(...)
):
    try:
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