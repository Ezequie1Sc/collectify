export interface SaleItem {
  product_id: string;
  owner_id: string;
  quantity: number;
  unit_price: number;
}

export interface SaleCreate {
  seller_id: string;
  items: SaleItem[];
}

export interface Sale {
  id: string;
  ticket_number: number;
  seller_id: string;
  total: number;
  created_at: string;
}

export interface SaleItemResponse {
  id: string;
  sale_id: string;
  product_id: string;
  owner_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleResponse {
  sale: Sale;
  items: SaleItemResponse[];
  summary: {
    total: number;
    cost: number;
    profit: number;
  };
}