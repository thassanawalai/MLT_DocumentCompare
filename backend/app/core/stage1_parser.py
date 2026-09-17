import io
import pandas as pd
import pdfplumber
from typing import List, Dict, Any
from app.models.document import ParsedDocument, WordItem, BBox

def parse_pdf(file_bytes: bytes, filename: str) -> ParsedDocument:
    """Parse a PDF file to extract raw text and word-level bounding boxes."""
    raw_text = ""
    words_list: List[WordItem] = []
    
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        if not pdf.pages:
            raise ValueError("PDF file has no pages.")
        
        # Typically, SI documents have the critical information on the first page.
        # This can be expanded to iterate over multiple pages if needed.
        first_page = pdf.pages[0]
        
        # 1. Extract raw text for the AI Context Window
        extracted_text = first_page.extract_text()
        if extracted_text:
            raw_text = extracted_text
        
        # 2. Extract word-level bounding boxes for Spatial Re-stitching
        extracted_words = first_page.extract_words(
            keep_blank_chars=False,
            use_text_flow=True
        )
        
        for w in extracted_words:
            words_list.append(
                WordItem(
                    text=w["text"],
                    bbox=BBox(
                        x0=w["x0"],
                        top=w["top"],
                        x1=w["x1"],
                        bottom=w["bottom"]
                    )
                )
            )
            
    return ParsedDocument(
        filename=filename,
        is_excel=False,
        raw_text=raw_text,
        words=words_list
    )

def parse_excel(file_bytes: bytes, filename: str) -> ParsedDocument:
    """Parse an Excel or CSV file to extract data as a dictionary."""
    try:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        else:
            df = pd.read_excel(io.BytesIO(file_bytes))
            
        if df.empty:
            raise ValueError("Spreadsheet is empty.")
            
        # Extract the first row as the primary data source
        first_row = df.iloc[0].fillna("").to_dict()
        
        # Convert all values to strings to maintain consistency across the pipeline
        str_data: Dict[str, Any] = {str(k): str(v).strip() for k, v in first_row.items()}
        
        return ParsedDocument(
            filename=filename,
            is_excel=True,
            excel_data=str_data
        )
    except Exception as e:
        raise ValueError(f"Failed to parse spreadsheet: {str(e)}")

def parse_document(file_bytes: bytes, filename: str) -> ParsedDocument:
    """Main entry point to route the file to the correct parser."""
    lower_filename = filename.lower()
    
    if lower_filename.endswith(".pdf"):
        return parse_pdf(file_bytes, filename)
    elif lower_filename.endswith((".xlsx", ".xls", ".csv")):
        return parse_excel(file_bytes, filename)
    else:
        raise ValueError("Unsupported file format. Please upload PDF, XLSX, or CSV.")