from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db import Base

class Customer(Base):
    __tablename__ = "customers"
    
    customer_id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True, nullable=False)
    customer_type = Column(String)
    raw_address = Column(Text)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String)
    status = Column(String, default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    contacts = relationship("CustomerContact", back_populates="customer", cascade="all, delete-orphan")
    banks = relationship("CustomerBank", back_populates="customer", cascade="all, delete-orphan")
    identifiers = relationship("CustomerIdentifier", back_populates="customer", cascade="all, delete-orphan")
    addresses = relationship("CustomerAddress", back_populates="customer", cascade="all, delete-orphan")

class CustomerAddress(Base):
    __tablename__ = "customer_addresses"
    
    address_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"))
    address_type = Column(String)
    raw_address = Column(Text)
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String)
    is_primary = Column(Boolean, default=False)
    
    customer = relationship("Customer", back_populates="addresses")

class CustomerContact(Base):
    __tablename__ = "customer_contacts"
    
    contact_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"))
    contact_name = Column(String)
    job_title = Column(String)
    contact_type = Column(String)
    email = Column(String, index=True)
    phone = Column(String, index=True)
    fax = Column(String)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="contacts")

class CustomerBank(Base):
    __tablename__ = "customer_banks"
    
    bank_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"))
    bank_name = Column(String)
    branch_name = Column(String)
    bank_address = Column(String)
    bank_country = Column(String)
    swift_bic_code = Column(String)
    account_no = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="banks")

class CustomerIdentifier(Base):
    __tablename__ = "customer_identifiers"
    
    identifier_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id", ondelete="CASCADE"))
    identifier_type = Column(String, index=True)
    identifier_value = Column(String, index=True)
    issuing_country = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="identifiers")
