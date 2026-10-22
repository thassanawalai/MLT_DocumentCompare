"""Import the customer workbook into the customer master tables."""
import argparse
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.db import SessionLocal
from app.models.customer import (
    Customer,
    CustomerAddress,
    CustomerBank,
    CustomerContact,
    CustomerIdentifier,
)


WORKBOOK_NAME = "637232394860757623_DETAIL CUSTOMER_9096.xlsx"
SHEET_NAME = "THAI RAYON"

COUNTRY_RE = re.compile(
    r"\b(INDIA|PAKISTAN|BANGLADESH|THAILAND|CHINA|SINGAPORE|"
    r"UNITED STATES|USA|UNITED KINGDOM|UK)\b",
    re.IGNORECASE,
)
EMAIL_RE = re.compile(r"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}", re.IGNORECASE)
EMAIL_LABEL_RE = re.compile(r"\bE[\s\u00a0]*MAIL\b\s*[:*]?\s*", re.IGNORECASE)

IDENTIFIER_PATTERNS = [
    (re.compile(r"\bN\.?\s*T\.?\s*N\.?\s*(?:NO\.?|NUMBER)?\s*[:#.\-]?\s*([A-Z0-9][A-Z0-9./\-]*)", re.I), "NTN"),
    (re.compile(r"\bGSTIN\s*(?:NO\.?|NUMBER)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]*)", re.I), "GSTIN"),
    (re.compile(r"\bIEC\s*(?:NO\.?|NUMBER)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]*)", re.I), "IEC"),
    (re.compile(r"\bPAN\s*(?:NO\.?|NUMBER)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]*)", re.I), "PAN"),
    (re.compile(r"\bBIN\s*/?\s*VAT(?:\s+REG(?:ISTRATION)?\.?\s+NO\.?)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]*)", re.I), "BIN/VAT"),
    (re.compile(r"\bBIN\s*(?:NO\.?|NUMBER)?\s*[:#\-]?\s*([A-Z0-9][A-Z0-9./\-]*)", re.I), "BIN"),
]

PHONE_LABEL_RE = re.compile(
    r"\b(?P<label>CONTACT\s*(?:NO\.?|NUMBER)|TEL(?:EPHONE)?|PHONE|MOBILE|CELL|FAX)"
    r"(?:\b|(?=\s|[:#\-]))\s*[:#\-]?\s*(?P<value>.+)$",
    re.IGNORECASE,
)
BANK_FIELD_RE = re.compile(
    r"^\s*(?P<label>BRANCH(?:\s+NAME)?|SWIFT(?:\s*/\s*BIC)?|BIC|"
    r"ACCOUNT(?:\s+NO\.?|\s+NUMBER)?|A/C(?:\s+NO\.?)?)\s*[:#\-]?\s*(?P<value>.+)$",
    re.IGNORECASE,
)
BANK_NAME_RE = re.compile(r"^\s*BANK(?:\s+NAME)?\s*[:#\-]\s*(.+)$", re.IGNORECASE)


def clean_value(value: object) -> str:
    """Normalize Excel cell whitespace while preserving its wording."""
    if value is None or pd.isna(value):
        return ""
    text = str(value).replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return "" if text.casefold() in {"nan", "none", "null"} else text


def split_blocks(series: pd.Series) -> list[list[str]]:
    """Split column B into customer blocks separated by blank rows."""
    blocks: list[list[str]] = []
    current: list[str] = []

    for cell in series.tolist():
        value = clean_value(cell)
        if not value:
            if current:
                blocks.append(current)
                current = []
            continue
        if value.casefold() == "consignee/notify address":
            continue
        current.append(value)

    if current:
        blocks.append(current)
    return blocks


def extract_country(address: str) -> str | None:
    matches = list(COUNTRY_RE.finditer(address))
    if not matches:
        return None
    value = matches[-1].group(1).upper()
    return {"USA": "United States", "UK": "United Kingdom"}.get(value, value.title())


def parse_customer_block(block: list[str]) -> dict:
    """Convert one non-empty Excel block into customer and child-row data."""
    if not block:
        raise ValueError("Customer block cannot be empty")

    parsed = {
        "customer_name": clean_value(block[0]),
        "customer_type": None,
        "status": "Active",
        "country": None,
        "addresses": [],
        "contacts": [],
        "banks": [],
        "identifiers": [],
    }
    address_lines: list[str] = []
    seen_contacts: set[tuple[str, str]] = set()
    seen_identifiers: set[tuple[str, str]] = set()
    current_bank: dict | None = None

    def add_contact(contact_type: str, **values: str) -> None:
        key_value = values.get("email") or values.get("phone") or values.get("fax") or ""
        key = (contact_type.casefold(), key_value.casefold())
        if key_value and key not in seen_contacts:
            seen_contacts.add(key)
            parsed["contacts"].append({
                "contact_type": contact_type,
                "contact_name": None,
                "job_title": None,
                "email": None,
                "phone": None,
                "fax": None,
                "is_primary": not any(item["contact_type"] == contact_type for item in parsed["contacts"]),
                **values,
            })

    for raw_line in block[1:]:
        line = clean_value(raw_line)
        if not line or line.upper() in {"AND", "OR"}:
            continue

        # Emails can appear in a labeled or unlabeled line, including alongside an address.
        emails = EMAIL_RE.findall(line)
        for email in emails:
            add_contact("Email", email=email.rstrip(".,;"))
        line = EMAIL_RE.sub(" ", line)
        line = EMAIL_LABEL_RE.sub(" ", line)
        line = re.sub(r"\s+", " ", line).strip(" ,;:-")
        if not line:
            continue

        phone_match = PHONE_LABEL_RE.search(line)
        if phone_match:
            label = phone_match.group("label").upper()
            contact_type = "Fax" if label == "FAX" else "Phone"
            phone = phone_match.group("value").strip(" ,;:-")
            if phone:
                add_contact(contact_type, **({"fax": phone} if contact_type == "Fax" else {"phone": phone}))
            line = line[:phone_match.start()].strip(" ,;:-")

        # Store bank details in the latest bank row when the source spreads them across lines.
        bank_field = BANK_FIELD_RE.match(line)
        if bank_field and current_bank is not None:
            label = re.sub(r"[^A-Z]", "", bank_field.group("label").upper())
            value = bank_field.group("value").strip(" ,;:-")
            field = "branch_name" if label.startswith("BRANCH") else (
                "swift_bic_code" if label.startswith("SWIFT") or label == "BIC" else "account_no"
            )
            current_bank[field] = value
            continue

        if "BANK" in line.upper():
            name_match = BANK_NAME_RE.match(line)
            bank_name = (name_match.group(1) if name_match else line).strip(" ,;:-")
            current_bank = {
                "bank_name": bank_name,
                "branch_name": None,
                "bank_address": None,
                "bank_country": None,
                "swift_bic_code": None,
                "account_no": None,
            }
            parsed["banks"].append(current_bank)
            continue

        # One source row may contain more than one tax/registration identifier.
        identifier_found = False
        for pattern, identifier_type in IDENTIFIER_PATTERNS:
            for match in pattern.finditer(line):
                identifier_value = match.group(1).strip(" .,:;-")
                key = (identifier_type.casefold(), identifier_value.casefold())
                if identifier_value and key not in seen_identifiers:
                    seen_identifiers.add(key)
                    parsed["identifiers"].append({
                        "identifier_type": identifier_type,
                        "identifier_value": identifier_value,
                        "issuing_country": None,
                    })
                identifier_found = True
            line = pattern.sub(" ", line)

        residual = re.sub(r"\s+", " ", line).strip(" ,;:-")
        if residual and not (identifier_found and not re.search(r"[A-Za-z]{3,}", residual)):
            address_lines.append(residual)

    if address_lines:
        raw_address = " ".join(address_lines)
        country = extract_country(raw_address)
        parsed["country"] = country
        parsed["addresses"].append({
            "address_type": "General",
            "raw_address": raw_address,
            "address_line1": None,
            "address_line2": None,
            "city": None,
            "state": None,
            "postal_code": None,
            "country": country,
            "is_primary": True,
        })
        for bank in parsed["banks"]:
            bank["bank_country"] = country

    return parsed


def insert_customer(data: dict, db: Session) -> Customer:
    customer = Customer(
        customer_name=data["customer_name"],
        customer_type=data["customer_type"],
        status=data["status"],
        country=data["country"],
    )
    customer.addresses = [CustomerAddress(**row) for row in data["addresses"]]
    customer.contacts = [CustomerContact(**row) for row in data["contacts"]]
    customer.banks = [CustomerBank(**row) for row in data["banks"]]
    customer.identifiers = [CustomerIdentifier(**row) for row in data["identifiers"]]
    db.add(customer)
    return customer


def find_workbook() -> Path:
    project_root = Path(__file__).resolve().parents[2]
    candidates = [
        Path("/import-data") / WORKBOOK_NAME,
        project_root / "frontend" / "public" / WORKBOOK_NAME,
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    checked = ", ".join(str(path) for path in candidates)
    raise FileNotFoundError(f"Customer workbook not found. Checked: {checked}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import the customer workbook once.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace existing customer rows with this workbook. Use only when refreshing this dataset.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse the workbook and print counts without connecting to or changing the database.",
    )
    args = parser.parse_args()

    workbook = find_workbook()
    dataframe = pd.read_excel(workbook, sheet_name=SHEET_NAME, header=None)
    if dataframe.shape[1] < 2:
        raise ValueError(f"Expected customer data in column B of the {SHEET_NAME!r} sheet.")

    blocks = split_blocks(dataframe.iloc[:, 1])
    records = [parse_customer_block(block) for block in blocks]
    if not records:
        raise ValueError(f"No customer blocks found in column B of the {SHEET_NAME!r} sheet.")

    counts = {
        "customers": len(records),
        "addresses": sum(len(row["addresses"]) for row in records),
        "contacts": sum(len(row["contacts"]) for row in records),
        "banks": sum(len(row["banks"]) for row in records),
        "identifiers": sum(len(row["identifiers"]) for row in records),
    }
    if args.dry_run:
        print(f"Dry run: parsed {counts} from {workbook}; database unchanged.")
        return

    db = SessionLocal()
    try:
        has_customers = db.query(Customer.customer_id).first() is not None
        if has_customers and not args.replace:
            raise RuntimeError(
                "Customer table already contains records; refusing to import duplicates. "
                "Use --replace only when intentionally refreshing this customer dataset."
            )
        if has_customers:
            db.query(Customer).delete(synchronize_session=False)
        for record in records:
            insert_customer(record, db)
        db.commit()
        print(f"Imported {counts} from {workbook}.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
