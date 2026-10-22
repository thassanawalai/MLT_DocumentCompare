import io
import pandas as pd
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Body, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.customer import (
    Customer, CustomerAddress, CustomerBank, CustomerContact, CustomerIdentifier,
)
from app.services.process_service import process_pdf
from app.templates.registry import _template_map
import os

router = APIRouter()


@router.get("/customers/search")
def search_customers(
    keyword: Optional[str] = Query(None, description="Company name or any customer field"),
    db: Session = Depends(get_db),
):
    """List customers, or search across the company and its related records."""
    statement = select(Customer)
    normalized_keyword = (keyword or "").strip()
    if normalized_keyword:
        term = f"%{normalized_keyword}%"
        statement = (
            statement
            .outerjoin(CustomerContact, CustomerContact.customer_id == Customer.customer_id)
            .outerjoin(CustomerAddress, CustomerAddress.customer_id == Customer.customer_id)
            .outerjoin(CustomerBank, CustomerBank.customer_id == Customer.customer_id)
            .outerjoin(CustomerIdentifier, CustomerIdentifier.customer_id == Customer.customer_id)
            .where(
            or_(
                Customer.customer_name.ilike(term),
                Customer.customer_type.ilike(term),
                Customer.status.ilike(term),
                Customer.raw_address.ilike(term),
                Customer.city.ilike(term),
                Customer.state.ilike(term),
                Customer.postal_code.ilike(term),
                Customer.country.ilike(term),
                CustomerContact.contact_name.ilike(term),
                CustomerContact.job_title.ilike(term),
                CustomerContact.contact_type.ilike(term),
                CustomerContact.email.ilike(term),
                CustomerContact.phone.ilike(term),
                CustomerContact.fax.ilike(term),
                CustomerAddress.raw_address.ilike(term),
                CustomerAddress.address_line1.ilike(term),
                CustomerAddress.address_line2.ilike(term),
                CustomerAddress.city.ilike(term),
                CustomerAddress.state.ilike(term),
                CustomerAddress.postal_code.ilike(term),
                CustomerAddress.country.ilike(term),
                CustomerBank.bank_name.ilike(term),
                CustomerBank.branch_name.ilike(term),
                CustomerBank.bank_address.ilike(term),
                CustomerBank.bank_country.ilike(term),
                CustomerBank.swift_bic_code.ilike(term),
                CustomerBank.account_no.ilike(term),
                CustomerIdentifier.identifier_value.ilike(term),
                CustomerIdentifier.identifier_type.ilike(term),
                )
            )
            .distinct()
        )
    statement = statement.order_by(Customer.customer_name, Customer.customer_id)
    customers = db.scalars(statement).all()
    return [
        {
            "customer_id": customer.customer_id,
            "customer_name": customer.customer_name,
            "customer_type": customer.customer_type,
            "raw_address": customer.raw_address,
            "address_line1": customer.address_line1,
            "address_line2": customer.address_line2,
            "city": customer.city,
            "state": customer.state,
            "postal_code": customer.postal_code,
            "country": customer.country,
            "status": customer.status,
            "addresses": [
                {
                    "address_type": address.address_type,
                    "raw_address": address.raw_address,
                    "address_line1": address.address_line1,
                    "address_line2": address.address_line2,
                    "city": address.city,
                    "state": address.state,
                    "postal_code": address.postal_code,
                    "country": address.country,
                    "is_primary": address.is_primary,
                }
                for address in customer.addresses
            ],
            "contacts": [
                {
                    "contact_name": contact.contact_name,
                    "job_title": contact.job_title,
                    "contact_type": contact.contact_type,
                    "email": contact.email,
                    "phone": contact.phone,
                    "fax": contact.fax,
                    "is_primary": contact.is_primary,
                }
                for contact in customer.contacts
            ],
            "banks": [
                {
                    "bank_name": bank.bank_name,
                    "branch_name": bank.branch_name,
                    "bank_country": bank.bank_country,
                    "swift_bic_code": bank.swift_bic_code,
                    "account_no": bank.account_no,
                }
                for bank in customer.banks
            ],
            "identifiers": [
                {
                    "identifier_type": identifier.identifier_type,
                    "identifier_value": identifier.identifier_value,
                    "issuing_country": identifier.issuing_country,
                }
                for identifier in customer.identifiers
            ],
        }
        for customer in customers
    ]

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
