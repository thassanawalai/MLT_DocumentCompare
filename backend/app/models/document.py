from pydantic import BaseModel
from typing import List, Optional

class BBox(BaseModel):
    """Bounding box coordinates on the document page."""
    x0: float
    top: float
    x1: float
    bottom: float

class WordItem(BaseModel):
    """Single word data including its text and bounding box."""
    text: str
    bbox: BBox

class ParsedDocument(BaseModel):
    """Fully parsed document data (Stage 1 Output)."""
    filename: str
    is_excel: bool = False
    raw_text: str = ""
    words: List[WordItem] = []
    excel_data: Optional[dict] = None