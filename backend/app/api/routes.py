import io
import pandas as pd
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Body
from app.services.process_service import process_pdf
from app.templates.registry import _template_map
import os

router = APIRouter()

@router.get("/templates")
def get_templates():
    """Return a list of all available templates."""
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
        # 1. Handle EXCEL or CSV file cases
        # ==========================================
        if filename.endswith((".xlsx", ".xls", ".csv")):
            # Read file contents
            contents = await file_program.read()
            
            if filename.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(contents))
            else:
                df = pd.read_excel(io.BytesIO(contents))
            
            if df.empty:
                raise HTTPException(status_code=400, detail="Excel file contains no data")
            
            # Extract data from the first row (Index 0)
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

            # Return data to frontend (no bbox or image needed for Excel)
            return {
                "status": "success",
                "program": {
                    "data": extracted_data,
                    "image": None 
                }
            }

        # ==========================================
        # 2. Handle PDF file cases (delegate to existing service)
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

# ==============================================================
# Save Freetime Data Endpoint
# ==============================================================
@router.post("/save-freetime")
async def save_freetime_data(data: list = Body(...)):
    try:
        # Save the file to /frontend/public/freetime_data.xlsx 
        # (assuming backend and frontend are parallel directories)
        current_dir = Path(__file__).resolve().parent
        project_root = current_dir.parent.parent.parent
        file_path = project_root / "frontend" / "public" / "freetime_data.xlsx"

        if not file_path.parent.exists():
            raise FileNotFoundError(f"Target directory does not exist: {file_path.parent}")
        
        df = pd.DataFrame(data)

        # 1. Remove the 'id' column used only in React before saving
        if 'id' in df.columns:
            df = df.drop(columns=['id'])

        # 2. Rename columns to match the original Excel headers exactly
        df = df.rename(columns={
            "LAT_KRABANG": "LAT KRABANG",
            "LAEM_CHABANG": "LAEM CHABANG",
            "PAT_BANGKOK": "PAT (BANGKOK)",
            "DEM_20_40": "DEM  20'GP & 40'HC",
            "DT_20_40": "DT  20'GP & 40'HC",
            "DEM_REEFER": "DEM/REFFER",
            "DET_REEFER": "DET/REFFEER"
        })

        # 3. Reorder columns to match the original layout
        cols_order = [
            "Carrier", "LAT KRABANG", "LAEM CHABANG", "PAT (BANGKOK)", 
            "REEFER", "SONGKLA", "REMARK", "FREE TIME PLUG",
            "DEM  20'GP & 40'HC", "DT  20'GP & 40'HC", "DEM/REFFER", "DET/REFFEER"
        ]
        
        # Add any missing columns with empty values
        for col in cols_order:
            if col not in df.columns:
                df[col] = ""

        df = df[cols_order]

        # 4. Overwrite the Excel file
        # Use engine='openpyxl' to ensure proper .xlsx saving
        df.to_excel(str(file_path), index=False, engine='openpyxl')
        
        return {"status": "success", "message": "Data successfully saved to Excel"}

    except Exception as e:
        # Return a 500 error with the exception details if it fails
        raise HTTPException(status_code=500, detail=str(e))