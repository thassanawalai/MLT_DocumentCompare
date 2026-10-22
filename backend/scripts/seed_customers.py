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
CONTACT_HEADER_RE = re.compile(
    r"^\s*(?:CONTACT\s*(?:NO\.?|NUMBER)?|TEL(?:EPHONE)?|PHONE|MOBILE|CELL|FAX|"
    r"E[\s\u00a0]*MAIL)\b",
    re.IGNORECASE,
)
PERSON_NAME_RE = re.compile(r"^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$")

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
    blank_rows = 0

    for cell in series.tolist():
        value = clean_value(cell)
        if not value:
            if current:
                blocks.append(current)
                current = []
                blank_rows = 1
            elif blocks:
                blank_rows += 1
            continue
        if value.casefold() == "consignee/notify address":
            continue

        # A single email line directly after a customer's last row is a continuation,
        # as with ABDULLAH FIBRES. Do not turn it into a separate customer block.
        if (
            not current
            and blocks
            and blank_rows == 1
            and (CONTACT_HEADER_RE.match(value) or EMAIL_RE.search(value))
        ):
            blocks[-1].append(value)
            continue

        current.append(value)
        blank_rows = 0

    if current:
        blocks.append(current)
    return blocks


def extract_country(address: str) -> str | None:
    matches = list(COUNTRY_RE.finditer(address))
    if not matches:
        return None
    value = matches[-1].group(1).upper()
    return {"USA": "United States", "UK": "United Kingdom"}.get(value, value.title())


def parse_customer_block(block: list[str]) -> dict | None:
    """Convert one non-empty Excel block into customer and child-row data."""
    if not block:
        return None

    first_line = clean_value(block[0])
    # The workbook has a few detached contact-only blocks. They are not companies;
    # importing their first TEL/EMAIL line as customer_name creates bogus customers.
    if CONTACT_HEADER_RE.match(first_line) or EMAIL_RE.search(first_line):
        return None

    customer_name = first_line
    contact_person = None
    body_start = 1
    # One block lists a person's name first and the company on the next line.
    if (
        len(block) > 1
        and PERSON_NAME_RE.fullmatch(first_line)
        and not PERSON_NAME_RE.fullmatch(clean_value(block[1]))
        and not CONTACT_HEADER_RE.match(clean_value(block[1]))
    ):
        contact_person = first_line
        customer_name = clean_value(block[1])
        body_start = 2

    parsed = {
        "customer_name": customer_name,
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
                "contact_name": contact_person,
                "job_title": None,
                "email": None,
                "phone": None,
                "fax": None,
                "is_primary": not any(item["contact_type"] == contact_type for item in parsed["contacts"]),
                **values,
            })

    for raw_line in block[body_start:]:
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

        # A bare label such as the workbook's standalone "TEL" row is not address data.
        if CONTACT_HEADER_RE.match(line):
            continue

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


def parse_normalized_workbook(workbook: Path) -> list[dict]:
    """Read the clean, one-record-per-row workbook format."""
    excel = pd.ExcelFile(workbook)
    if "Customers" not in excel.sheet_names:
        raise ValueError("Normalized workbook must contain a 'Customers' sheet.")

    def read_rows(sheet_name: str) -> list[dict[str, str]]:
        if sheet_name not in excel.sheet_names:
            return []
        frame = pd.read_excel(excel, sheet_name=sheet_name, dtype=object)
        frame.columns = [str(column).strip().casefold() for column in frame.columns]
        return [
            {str(key).strip().casefold(): clean_value(value) for key, value in row.items()}
            for row in frame.to_dict(orient="records")
        ]

    def as_bool(value: str, default: bool) -> bool:
        if not value:
            return default
        return value.casefold() in {"true", "1", "yes", "y"}

    records: list[dict] = []
    by_name: dict[str, dict] = {}
    for row_number, row in enumerate(read_rows("Customers"), start=2):
        name = clean_value(row.get("customer_name"))
        if not name:
            continue
        key = name.casefold()
        if key in by_name:
            raise ValueError(f"Duplicate customer_name {name!r} in Customers row {row_number}.")
        record = {
            "customer_name": name,
            "customer_type": clean_value(row.get("customer_type")) or None,
            "status": clean_value(row.get("status")) or "Active",
            "country": clean_value(row.get("country")) or None,
            "addresses": [],
            "contacts": [],
            "banks": [],
            "identifiers": [],
        }
        by_name[key] = record
        records.append(record)

    if not records:
        raise ValueError("The Customers sheet has no customer rows.")

    child_sheets = {
        "Addresses": ("addresses", (
            "address_type", "raw_address", "address_line1", "address_line2", "city",
            "state", "postal_code", "country",
        )),
        "Contacts": ("contacts", (
            "contact_name", "job_title", "contact_type", "email", "phone", "fax",
        )),
        "Banks": ("banks", (
            "bank_name", "branch_name", "bank_address", "bank_country", "swift_bic_code", "account_no",
        )),
        "Identifiers": ("identifiers", ("identifier_type", "identifier_value", "issuing_country")),
    }
    for sheet_name, (target, fields) in child_sheets.items():
        for row_number, row in enumerate(read_rows(sheet_name), start=2):
            name = clean_value(row.get("customer_name"))
            if not any(clean_value(row.get(field)) for field in fields):
                continue
            if not name:
                raise ValueError(f"{sheet_name} row {row_number} has data but no customer_name.")
            parent = by_name.get(name.casefold())
            if parent is None:
                raise ValueError(
                    f"{sheet_name} row {row_number} references unknown customer_name {name!r}. "
                    "Use the exact name from the Customers sheet."
                )
            item = {field: clean_value(row.get(field)) or None for field in fields}
            if target == "addresses":
                item["address_type"] = item["address_type"] or "General"
                item["country"] = item["country"] or parent["country"]
                item["is_primary"] = as_bool(row.get("is_primary", ""), not parent[target])
            elif target == "contacts":
                if not item["contact_type"]:
                    item["contact_type"] = (
                        "Email" if item["email"] else "Phone" if item["phone"] else "Fax" if item["fax"] else None
                    )
                item["is_primary"] = as_bool(row.get("is_primary", ""), not any(
                    entry["contact_type"] == item["contact_type"] for entry in parent[target]
                ))
            elif target == "banks":
                item["bank_country"] = item["bank_country"] or parent["country"]
            parent[target].append(item)
            if target == "addresses" and not parent["country"] and item.get("country"):
                parent["country"] = item["country"]

    return records


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
        "--workbook",
        type=Path,
        help="Workbook path. Supports the normalized Customers/Addresses/Contacts/Banks/Identifiers template.",
    )
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

    workbook = args.workbook if args.workbook else find_workbook()
    if not workbook.is_file():
        raise FileNotFoundError(f"Workbook not found: {workbook}")
    excel = pd.ExcelFile(workbook)
    skipped_blocks = 0
    if "Customers" in excel.sheet_names:
        records = parse_normalized_workbook(workbook)
    else:
        dataframe = pd.read_excel(excel, sheet_name=SHEET_NAME, header=None)
        if dataframe.shape[1] < 2:
            raise ValueError(f"Expected customer data in column B of the {SHEET_NAME!r} sheet.")
        blocks = split_blocks(dataframe.iloc[:, 1])
        records = [record for block in blocks if (record := parse_customer_block(block)) is not None]
        if not records:
            raise ValueError(f"No customer blocks found in column B of the {SHEET_NAME!r} sheet.")
        skipped_blocks = len(blocks) - len(records)

    counts = {
        "customers": len(records),
        "addresses": sum(len(row["addresses"]) for row in records),
        "contacts": sum(len(row["contacts"]) for row in records),
        "banks": sum(len(row["banks"]) for row in records),
        "identifiers": sum(len(row["identifiers"]) for row in records),
    }
    if args.dry_run:
        print(
            f"Dry run: parsed {counts} from {workbook}; "
            f"skipped {skipped_blocks} contact-only block(s); database unchanged."
        )
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
        print(f"Imported {counts} from {workbook}; skipped {skipped_blocks} contact-only block(s).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
