from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    owner_id: UUID
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    price: float = Field(gt=0)
    cost: Optional[float] = Field(default=None, ge=0)
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    cost: Optional[float] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None

class SaleItemCreate(BaseModel):
    product_id: UUID
    owner_id: UUID
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)

class SaleCreate(BaseModel):
    seller_id: UUID
    partner_id: UUID
    items: List[SaleItemCreate]

class SaleItem(BaseModel):
    id: UUID
    sale_id: UUID
    product_id: UUID
    owner_id: UUID
    quantity: int
    unit_price: float
    subtotal: float

class Sale(BaseModel):
    id: UUID
    ticket_number: int
    seller_id: UUID
    partner_id: Optional[UUID] = None
    total: float
    created_at: str

class SaleResponse(BaseModel):
    data: Sale

class PartnerCreate(BaseModel):
    name: str = Field(min_length=1)
    email: Optional[str] = None

class PartnerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1)
    email: Optional[str] = None
    is_active: Optional[bool] = None

class Partner(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    is_active: bool = True

class PartnersResponse(BaseModel):
    data: List[Partner]

class PartnerResponse(BaseModel):
    data: Partner
