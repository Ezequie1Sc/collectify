import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface ProductsResponse {
  data: Product[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'http://127.0.0.1:8000';

  constructor(private readonly http: HttpClient) {}

  getProducts(ownerId: string): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products/${ownerId}`
    );
  }
}