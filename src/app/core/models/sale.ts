// =========================================================
// SALE ITEM CREATE
// =========================================================

export interface SaleItem {
  product_id: string;
  owner_id: string;
  quantity: number;
  unit_price: number;
}


// =========================================================
// SALE CREATE
// =========================================================

export interface SaleCreate {
  seller_id: string;
  partner_id: string;
  items: SaleItem[];
}


// =========================================================
// SALE
// =========================================================

export interface Sale {
  id: string;
  ticket_number: number;
  seller_id: string;
  partner_id: string;
  total: number;
  created_at: string;
}


// =========================================================
// SALE ITEM RESPONSE
// =========================================================

export interface SaleItemResponse {
  id: string;
  sale_id: string;
  product_id: string;
  owner_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}


// =========================================================
// SALE PARTNER
// =========================================================

export interface SalePartner {
  id: string;
  name: string;
  email: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}


// =========================================================
// SALE SUMMARY
// =========================================================

export interface SaleSummary {
  total: number;
  cost: number;
  profit: number;
}


// =========================================================
// SALE RESPONSE
// =========================================================

export interface SaleResponse {
  sale: Sale;
  partner: SalePartner;
  items: SaleItemResponse[];
  summary: SaleSummary;
}