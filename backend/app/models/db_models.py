from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class HSCodeRecord(Base):
    __tablename__ = "hs_code_records"
    __table_args__ = (
        Index("ix_hs_code_records_hs_code", "hs_code"),
        Index("ix_hs_code_records_customer", "customer"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    sale: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    customer: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    commodity: Mapped[str] = mapped_column(Text, nullable=False, default="")
    hs_code: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class FreetimeRecord(Base):
    __tablename__ = "freetime_records"
    __table_args__ = (Index("ix_freetime_records_carrier", "carrier"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    carrier: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    lat_krabang: Mapped[str] = mapped_column(Text, nullable=False, default="")
    laem_chabang: Mapped[str] = mapped_column(Text, nullable=False, default="")
    pat_bangkok: Mapped[str] = mapped_column(Text, nullable=False, default="")
    songkla: Mapped[str] = mapped_column(Text, nullable=False, default="")
    reefer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    remark: Mapped[str] = mapped_column(Text, nullable=False, default="")
    free_time_plug: Mapped[str] = mapped_column(Text, nullable=False, default="")
    dem_20_40: Mapped[str] = mapped_column(Text, nullable=False, default="")
    dt_20_40: Mapped[str] = mapped_column(Text, nullable=False, default="")
    dem_reefer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    det_reefer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
