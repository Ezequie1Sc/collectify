import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductsResponse,
  ProductResponse
} from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://127.0.0.1:8000';

  getProducts(ownerId: string): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products/${ownerId}`
    );
  }

  createProduct(
    product: ProductCreate
  ): Observable<ProductsResponse> {
    return this.http.post<ProductsResponse>(
      `${this.baseUrl}/products`,
      product
    );
  }

  updateProduct(
    productId: string,
    product: ProductUpdate
  ): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/products/${productId}`,
      product
    );
  }
}