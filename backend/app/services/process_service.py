import os
import shutil

from fastapi import HTTPException

from app.core.pdf_parser import extract_bl_with_hybrid_bbox
from app.core.comparator import compare_data
from app.templates.registry import get_template

def process_pdf(company_original: str | None, company_program: str, file_original, file_program):
    """
    Main function to save files to temp, extract data, and compare.
    Handles both single-file extraction and two-file comparison.
    """
    
    # 1. Load program template
    program_template = get_template(company_program)
    if not program_template:
        raise HTTPException(status_code=400, detail=f"Unknown company for program document: {company_program}")

    if not file_program.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Program file must be PDF.")

    temp_prog_path = f"temp_prog_{file_program.filename}"
    temp_orig_path = None

    # Check if this is a comparison request (both files provided)
    is_comparison = bool(company_original and file_original)

    if is_comparison:
        template = get_template(company_original)
        if not template:
            raise HTTPException(status_code=400, detail=f"Unknown company for original document: {company_original}")
        if not file_original.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Original file must be PDF.")
        temp_orig_path = f"temp_orig_{file_original.filename}"

    try:
        # Save program file
        with open(temp_prog_path, "wb") as buffer:
            shutil.copyfileobj(file_program.file, buffer)

        # Extract program data
        prog_result = extract_bl_with_hybrid_bbox(
            temp_prog_path,
            program_template
        )
        prog_data = prog_result["data"]

        # If single file mode, return immediately without comparison
        if not is_comparison:
            return {
                "status": "success",
                "original": None,
                "program": {
                    "data": prog_data,
                    "image": prog_result["image"],
                    "images": prog_result["images"],
                    "page_count": prog_result["page_count"],
                },
                "discrepancies": [],
            }

        # If comparison mode, process the original file
        with open(temp_orig_path, "wb") as buffer:
            shutil.copyfileobj(file_original.file, buffer)

        orig_result = extract_bl_with_hybrid_bbox(
            temp_orig_path,
            template
        )
        orig_data = orig_result["data"]

        # Compare data
        orig_data, prog_data, discrepancies = compare_data(
            orig_data,
            prog_data
        )

        return {
            "status": "success",
            "original": {
                "data": orig_data,
                "image": orig_result["image"],
                "images": orig_result["images"],
                "page_count": orig_result["page_count"],
            },
            "program": {
                "data": prog_data,
                "image": prog_result["image"],
                "images": prog_result["images"],
                "page_count": prog_result["page_count"],
            },
            "discrepancies": discrepancies,
        }

    finally:
        # Clean up temp files
        if os.path.exists(temp_prog_path):
            os.remove(temp_prog_path)
        if temp_orig_path and os.path.exists(temp_orig_path):
            os.remove(temp_orig_path)