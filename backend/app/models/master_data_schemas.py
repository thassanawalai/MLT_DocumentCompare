from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class HSCodeFields(BaseModel):
    sale: str = Field(min_length=1, max_length=255)
    customer: str = Field(min_length=1, max_length=500)
    commodity: str = Field(min_length=1)
    hs_code: str = Field(min_length=1, max_length=100)


class HSCodeCreate(HSCodeFields):
    pass


class HSCodeUpdate(BaseModel):
    sale: str | None = Field(default=None, max_length=255)
    customer: str | None = Field(default=None, max_length=500)
    commodity: str | None = None
    hs_code: str | None = Field(default=None, max_length=100)


class HSCodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sale: str
    customer: str
    commodity: str
    hs_code: str
    created_at: datetime
    updated_at: datetime


class FreetimeFields(BaseModel):
    carrier: str = Field(min_length=1, max_length=255)
    lat_krabang: str = ""
    laem_chabang: str = ""
    pat_bangkok: str = ""
    songkla: str = ""
    reefer: str = ""
    remark: str = ""
    free_time_plug: str = ""
    dem_20_40: str = ""
    dt_20_40: str = ""
    dem_reefer: str = ""
    det_reefer: str = ""


class FreetimeCreate(FreetimeFields):
    pass


class FreetimeUpdate(BaseModel):
    carrier: str | None = Field(default=None, max_length=255)
    lat_krabang: str | None = None
    laem_chabang: str | None = None
    pat_bangkok: str | None = None
    songkla: str | None = None
    reefer: str | None = None
    remark: str | None = None
    free_time_plug: str | None = None
    dem_20_40: str | None = None
    dt_20_40: str | None = None
    dem_reefer: str | None = None
    det_reefer: str | None = None


class FreetimeOut(FreetimeFields):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
