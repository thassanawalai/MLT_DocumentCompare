from pydantic import BaseModel, Field
from typing import Optional

class BLDataExtraction(BaseModel):
    booking_no: Optional[str] = Field(None, description="BOOKING NO.")
    shipper: Optional[str] = Field(None, description="SHIPPER (complete name and address)")
    consignee: Optional[str] = Field(None, description="CONSIGNEE (complete name and address)")
    notify_party: Optional[str] = Field(None, description="NOTIFY PARTY (complete name and address)")
    pre_carriage_by: Optional[str] = Field(None, description="PRE-CARRIAGE BY")
    place_of_receipt: Optional[str] = Field(None, description="PLACE OF RECEIPT")
    port_of_loading: Optional[str] = Field(None, description="PORT OF LOADING")
    vessel: Optional[str] = Field(None, description="VESSEL / VOY NO.")
    port_of_discharge: Optional[str] = Field(None, description="PORT OF DISCHARGE")
    place_of_delivery: Optional[str] = Field(None, description="PLACE OF DELIVERY")
    mark: Optional[str] = Field(None, description="MARK / Marks & No.")
    quantity: Optional[str] = Field(None, description="QUANTITY / Number and Kind of Packages")
    description_of_good: Optional[str] = Field(None, description="DESCRIPTION OF GOODS / Particulars furnished by the Merchant")
    gross_weight: Optional[str] = Field(None, description="GROSS WEIGHT")
    measurement: Optional[str] = Field(None, description="MEASUREMENT")