export interface Product {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  category: string | null;
  sku: string | null;
  price: number;
  cost: number | null;
  stock: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}