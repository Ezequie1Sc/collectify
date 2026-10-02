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

  // ============================================
  // GET PRODUCTS
  // ============================================

  getProducts(
    ownerId: string
  ): Observable<ProductsResponse> {

    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products/${ownerId}`
    );
  }

  // ============================================
  // CREATE PRODUCT
  // ============================================

  createProduct(
    product: ProductCreate
  ): Observable<ProductsResponse> {

    return this.http.post<ProductsResponse>(
      `${this.baseUrl}/products`,
      product
    );
  }

  // ============================================
  // UPDATE PRODUCT
  // ============================================

  updateProduct(
    productId: string,
    product: ProductUpdate
  ): Observable<ProductResponse> {

    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/products/${productId}`,
      product
    );
  }

  // ============================================
  // DELETE PRODUCT
  // ============================================

  deleteProduct(
    productId: string
  ): Observable<{
    message: string;
    deleted: boolean;
    deactivated: boolean;
    data: Product;
  }> {

    return this.http.delete<{
      message: string;
      deleted: boolean;
      deactivated: boolean;
      data: Product;
    }>(
      `${this.baseUrl}/products/${productId}`
    );
  }
}