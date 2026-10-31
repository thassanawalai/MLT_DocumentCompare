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
                Customer.acid_no.ilike(term),
                Customer.importer_no.ilike(term),
                Customer.exporter_no.ilike(term),
                Customer.uasc_no.ilike(term),
                Customer.remark.ilike(term),
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
            "acid_no": customer.acid_no,
            "importer_no": customer.importer_no,
            "exporter_no": customer.exporter_no,
            "uasc_no": customer.uasc_no,
            "remark": customer.remark,
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

@router.post("/customers", status_code=201)
def create_customer(payload: dict = Body(...), db: Session = Depends(get_db)):
    """Create a company and any supplied master-data records."""
    name = payload.get("customer_name")
    if not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=422, detail="customer_name must not be empty")

    country = payload.get("country")
    status = payload.get("status", "Active")
    if country is not None and not isinstance(country, str):
        raise HTTPException(status_code=422, detail="country must be a string or null")
    if status is not None and not isinstance(status, str):
        raise HTTPException(status_code=422, detail="status must be a string or null")

    customer = Customer(
        customer_name=name.strip(),
        country=country.strip() if country and country.strip() else None,
        status=status.strip() if status and status.strip() else "Active",
        acid_no=payload.get("acid_no"),
        importer_no=payload.get("importer_no"),
        exporter_no=payload.get("exporter_no"),
        uasc_no=payload.get("uasc_no"),
        remark=payload.get("remark"),
    )
    db.add(customer)
    db.flush()

    relationship_specs = {
        "addresses": (CustomerAddress, ("address_type", "raw_address", "address_line1", "address_line2", "city", "state", "postal_code", "country", "is_primary")),
        "contacts": (CustomerContact, ("contact_name", "job_title", "contact_type", "email", "phone", "fax", "is_primary")),
        "banks": (CustomerBank, ("bank_name", "branch_name", "bank_address", "bank_country", "swift_bic_code", "account_no")),
        "identifiers": (CustomerIdentifier, ("identifier_type", "identifier_value", "issuing_country")),
    }
    for relationship_name, (model, allowed_fields) in relationship_specs.items():
        entries = payload.get(relationship_name, [])
        if not isinstance(entries, list) or any(not isinstance(entry, dict) for entry in entries):
            raise HTTPException(status_code=422, detail=f"{relationship_name} must be a list of objects")
        for index, entry in enumerate(entries):
            values = {
                key: (value.strip() or None if isinstance(value, str) else value)
                for key, value in entry.items()
                if key in allowed_fields
            }
            if relationship_name == "addresses":
                values.setdefault("is_primary", index == 0)
                if not values.get("country"):
                    values["country"] = customer.country
            elif relationship_name == "contacts":
                if not values.get("contact_type"):
                    values["contact_type"] = "Email" if values.get("email") else "Phone" if values.get("phone") else "Fax" if values.get("fax") else None
                values.setdefault("is_primary", index == 0)
            elif relationship_name == "banks" and not values.get("bank_country"):
                values["bank_country"] = customer.country
            elif relationship_name == "identifiers" and not values.get("issuing_country"):
                values["issuing_country"] = customer.country
            getattr(customer, relationship_name).append(model(**values))

    try:
        db.commit()
        db.refresh(customer)
    except Exception:
        db.rollback()
        raise
    return {
        "customer_id": customer.customer_id,
        "customer_name": customer.customer_name,
        "country": customer.country,
        "status": customer.status,
    }


@router.patch("/customers/{customer_id}")
def update_customer(
    customer_id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
):
    """Update the customer's editable summary fields."""
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    if "customer_name" in payload:
        name = payload["customer_name"]
        if not isinstance(name, str) or not name.strip():
            raise HTTPException(status_code=422, detail="customer_name must not be empty")
        customer.customer_name = name.strip()
    if "country" in payload:
        country = payload["country"]
        if country is not None and not isinstance(country, str):
            raise HTTPException(status_code=422, detail="country must be a string or null")
        customer.country = country.strip() if country and country.strip() else None
        primary_address = next((address for address in customer.addresses if address.is_primary), None)
        if primary_address:
            primary_address.country = customer.country
    if "status" in payload:
        status = payload["status"]
        if status is not None and not isinstance(status, str):
            raise HTTPException(status_code=422, detail="status must be a string or null")
        customer.status = status.strip() if status and status.strip() else None

        company_fields = [
    "acid_no",
    "importer_no",
    "exporter_no",
    "uasc_no",
    "remark",
]

for field in company_fields:
    if field in payload:
        value = payload[field]

        if value is not None and not isinstance(value, str):
            raise HTTPException(
                status_code=422,
                detail=f"{field} must be a string or null"
            )

        setattr(customer, field, value.strip() or None if value else None)

    relationship_specs = {
        "addresses": (CustomerAddress, ("address_type", "raw_address", "address_line1", "address_line2", "city", "state", "postal_code", "country", "is_primary")),
        "contacts": (CustomerContact, ("contact_name", "job_title", "contact_type", "email", "phone", "fax", "is_primary")),
        "banks": (CustomerBank, ("bank_name", "branch_name", "bank_address", "bank_country", "swift_bic_code", "account_no")),
        "identifiers": (CustomerIdentifier, ("identifier_type", "identifier_value", "issuing_country")),
    }
    for relationship_name, (model, allowed_fields) in relationship_specs.items():
        if relationship_name not in payload:
            continue
        entries = payload[relationship_name]
        if not isinstance(entries, list) or any(not isinstance(entry, dict) for entry in entries):
            raise HTTPException(status_code=422, detail=f"{relationship_name} must be a list of objects")
        replacements = []
        for index, entry in enumerate(entries):
            values = {
                key: (value.strip() or None if isinstance(value, str) else value)
                for key, value in entry.items()
                if key in allowed_fields
            }
            if relationship_name == "addresses":
                values.setdefault("is_primary", index == 0)
            elif relationship_name == "contacts":
                if not values.get("contact_type"):
                    values["contact_type"] = "Email" if values.get("email") else "Phone" if values.get("phone") else "Fax" if values.get("fax") else None
                values.setdefault("is_primary", index == 0)
            elif relationship_name == "banks":
                if not values.get("bank_country"):
                    values["bank_country"] = customer.country
            elif relationship_name == "identifiers":
                if not values.get("issuing_country"):
                    values["issuing_country"] = customer.country
            replacements.append(model(**values))
        getattr(customer, relationship_name)[:] = replacements

    if "country" in payload:
        primary_address = next((address for address in customer.addresses if address.is_primary), None)
        if primary_address:
            primary_address.country = customer.country

    db.commit()
    db.refresh(customer)
    return {
        "customer_id": customer.customer_id,
        "customer_name": customer.customer_name,
        "country": customer.country,
        "status": customer.status,
    }


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer and its related records."""
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"deleted": True, "customer_id": customer_id}


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
