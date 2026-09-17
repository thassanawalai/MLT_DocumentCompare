from pydantic import BaseModel
from typing import Optional
from app.models.document import BBox

class ExtractedField(BaseModel):
    """Data structure for each extracted field sent back to the UI."""
    value: str
    bbox: Optional[BBox] = None
    # confidence: float = 1.0

class SIExtractionResult(BaseModel):
    """Complete SI document extracted fields (Final Output)."""
    booking_no: Optional[ExtractedField] = None
    shipper: Optional[ExtractedField] = None
    consignee: Optional[ExtractedField] = None
    notify_party: Optional[ExtractedField] = None
    feeder: Optional[ExtractedField] = None
    vessel: Optional[ExtractedField] = None
    port_of_loading: Optional[ExtractedField] = None
    port_of_discharge: Optional[ExtractedField] = None
    place_of_delivery: Optional[ExtractedField] = None
    place_of_receipt: Optional[ExtractedField] = None
    mark: Optional[ExtractedField] = None
    description: Optional[ExtractedField] = None
    quantity: Optional[ExtractedField] = None
    gross_weight: Optional[ExtractedField] = None
    measurement: Optional[ExtractedField] = None