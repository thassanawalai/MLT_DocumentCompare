"""Import the customer workbook into the customer master tables."""
import re
import sys
import argparse
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db import SessionLocal
from app.models.customer import Customer, CustomerAddress, CustomerBank, CustomerContact, CustomerIdentifier


def parse_customer_block(block: list[str], db: Session) -> None:
    if not block:
        return

    customer = Customer(customer_name=block[0].strip(), status="Active")
    db.add(customer)
    db.flush()
    address_lines = []
    customer.country = None

    for line in block[1:]:
        value = str(line).strip()
        if not value or value.lower() == "nan":
            continue
        upper = value.upper()

        if "EMAIL:" in upper or "@" in value:
            emails = re.split(r"[;,]", re.sub(r"EMAIL\s*:", "", value, flags=re.I))
            for index, email in enumerate(emails):
                if email.strip():
                    db.add(CustomerContact(customer_id=customer.customer_id, contact_type="Email", email=email.strip(), is_primary=index == 0))
            continue

        phone_match = re.search(r"(?:CONTACT\s*NO\.?|TEL|PHONE|MOBILE|CELL)\s*[:#-]\s*(.+)$", value, flags=re.I)
        if phone_match:
            phone = phone_match.group(1).strip()
            db.add(CustomerContact(customer_id=customer.customer_id, contact_type="Phone", phone=phone, is_primary=True))
            address_prefix = value[:phone_match.start()].strip(" ,;:-")
            if address_prefix:
                address_lines.append(address_prefix)
            continue

        if "BANK" in upper:
            db.add(CustomerBank(customer_id=customer.customer_id, bank_name=value))
            continue

        matched_identifier = False
        for keyword, identifier_type in (("N.T.N", "NTN"), ("GSTIN", "GSTIN"), ("IEC", "IEC"), ("PAN", "PAN"), ("BIN", "BIN")):
            match = re.search(rf"{re.escape(keyword)}\s*[:#-]?\s*(.+)", value, flags=re.I)
            if match:
                identifier_value = match.group(1).strip()
                if identifier_value:
                    db.add(CustomerIdentifier(customer_id=customer.customer_id, identifier_type=identifier_type, identifier_value=identifier_value))
                matched_identifier = True
                break
        if not matched_identifier and value.upper() not in {"AND", "OR"}:
            address_lines.append(value)

    if address_lines:
        raw_address = " ".join(address_lines)
        country_match = re.search(r"\b(INDIA|PAKISTAN|BANGLADESH|THAILAND|CHINA|SINGAPORE|UNITED STATES|USA|UNITED KINGDOM|UK)\b\s*$", raw_address, flags=re.I)
        country = country_match.group(1).title() if country_match else None
        customer.country = country
        db.add(CustomerAddress(customer_id=customer.customer_id, address_type="General", raw_address=raw_address, country=country, is_primary=True))


def main() -> None:
    parser = argparse.ArgumentParser(description="Import the customer workbook once.")
    parser.add_argument("--replace", action="store_true", help="Replace the current customer dataset with the workbook contents.")
    args = parser.parse_args()
    filename = "637232394860757623_DETAIL CUSTOMER_9096.xlsx"
    project_root = Path(__file__).resolve().parents[2]
    candidates = [Path("/import-data") / filename, project_root / "frontend" / "public" / filename]
    workbook = next((path for path in candidates if path.is_file()), None)
    if workbook is None:
        raise FileNotFoundError(f"Customer workbook not found. Checked: {', '.join(map(str, candidates))}")

    db = SessionLocal()
    try:
        if db.query(Customer.customer_id).first() is not None:
            if not args.replace:
                raise RuntimeError("Customer table already contains records; pass --replace to refresh this imported dataset.")
            db.query(Customer).delete(synchronize_session=False)
        df = pd.read_excel(workbook, sheet_name="THAI RAYON", header=None)
        if df.shape[1] < 2:
            raise ValueError("Expected customer data in column B of the THAI RAYON sheet.")

        count = 0
        block = []
        for cell in df[1].tolist():
            value = "" if pd.isna(cell) else str(cell).strip()
            if not value:
                if block:
                    parse_customer_block(block, db)
                    count += 1
                    block = []
            else:
                block.append(value)
        if block:
            parse_customer_block(block, db)
            count += 1

        db.commit()
        print(f"Imported {count} customers from {workbook}.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
