from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.db_models import FreetimeRecord, HSCodeRecord
from app.models.master_data_schemas import (
    FreetimeCreate,
    FreetimeOut,
    FreetimeUpdate,
    HSCodeCreate,
    HSCodeOut,
    HSCodeUpdate,
)


router = APIRouter()


def _changes(payload, *, empty_values: bool = False) -> dict:
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="At least one field must be provided")
    if empty_values:
        changes = {field: "" if value is None else value for field, value in changes.items()}
    return changes


@router.get("/hs-codes", response_model=list[HSCodeOut])
def list_hs_codes(db: Session = Depends(get_db)):
    return db.scalars(select(HSCodeRecord).order_by(HSCodeRecord.id)).all()


@router.post("/hs-codes", response_model=HSCodeOut, status_code=status.HTTP_201_CREATED)
def create_hs_code(payload: HSCodeCreate, db: Session = Depends(get_db)):
    record = HSCodeRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/hs-codes/{record_id}", response_model=HSCodeOut)
def update_hs_code(record_id: int, payload: HSCodeUpdate, db: Session = Depends(get_db)):
    record = db.get(HSCodeRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="HS Code record not found")
    for field, value in _changes(payload, empty_values=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/hs-codes/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hs_code(record_id: int, db: Session = Depends(get_db)):
    record = db.get(HSCodeRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="HS Code record not found")
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/freetime", response_model=list[FreetimeOut])
def list_freetime(db: Session = Depends(get_db)):
    return db.scalars(select(FreetimeRecord).order_by(FreetimeRecord.id)).all()


@router.post("/freetime", response_model=FreetimeOut, status_code=status.HTTP_201_CREATED)
def create_freetime(payload: FreetimeCreate, db: Session = Depends(get_db)):
    record = FreetimeRecord(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/freetime/{record_id}", response_model=FreetimeOut)
def update_freetime(record_id: int, payload: FreetimeUpdate, db: Session = Depends(get_db)):
    record = db.get(FreetimeRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Freetime record not found")
    for field, value in _changes(payload, empty_values=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/freetime/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_freetime(record_id: int, db: Session = Depends(get_db)):
    record = db.get(FreetimeRecord, record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Freetime record not found")
    db.delete(record)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
