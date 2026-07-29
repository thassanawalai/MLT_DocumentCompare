from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
from app.core.vlm_extractor import VLMProcessor
from pdf2image import convert_from_path

# ถูกต้อง: ใส่แค่ /api/v1 พอ ห้ามใส่ http://...
router = APIRouter(prefix="/api/v1", tags=["Document Processing"])

vlm_processor = VLMProcessor(model_name="llava")
POPPLER_DIR = r"C:\poppler-26.02.0\Library\bin"

@router.post("/process-pdf")
async def process_pdf_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF files are accepted.")

    temp_pdf_path = f"temp_{file.filename}"
    temp_image_path = "temp_page.jpg"

    try:
        with open(temp_pdf_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        images = convert_from_path(
            temp_pdf_path, 
            first_page=1, 
            last_page=1, 
            poppler_path=POPPLER_DIR
        )
        
        if not images:
            raise HTTPException(status_code=500, detail="Failed to convert PDF to image.")
            
        images[0].save(temp_image_path, "JPEG")

        extraction_prompt = "Analyze this document image and extract all key information accurately. Provide the extracted details clearly."
        result = vlm_processor.analyze_image(temp_image_path, extraction_prompt)

        if result["status"] == "error":
            raise HTTPException(status_code=500, detail=result["message"])

        return {
            "status": "success",
            "filename": file.filename,
            "extracted_data": result["extracted_text"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)