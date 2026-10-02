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

import {
  SaleCreate,
  SaleResponse
} from '../models/sale';

import {
  Partner,
  PartnerCreate,
  PartnerUpdate,
  PartnersResponse,
  PartnerResponse
} from '../models/partner';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    'http://127.0.0.1:8000';


  // =========================================================
  // PRODUCTS
  // =========================================================

  getProducts(
    ownerId: string
  ): Observable<ProductsResponse> {

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


  // =========================================================
  // SALES
  // =========================================================

  createSale(
    sale: SaleCreate
  ): Observable<SaleResponse> {

    return this.http.post<SaleResponse>(
      `${this.baseUrl}/sales`,
      sale
    );
  }


  // =========================================================
  // PARTNERS
  // =========================================================

  getPartners(): Observable<PartnersResponse> {

    return this.http.get<PartnersResponse>(
      `${this.baseUrl}/partners`
    );
  }


  createPartner(
    partner: PartnerCreate
  ): Observable<PartnerResponse> {

    return this.http.post<PartnerResponse>(
      `${this.baseUrl}/partners`,
      partner
    );
  }


  updatePartner(
    partnerId: string,
    partner: PartnerUpdate
  ): Observable<PartnerResponse> {

    return this.http.patch<PartnerResponse>(
      `${this.baseUrl}/partners/${partnerId}`,
      partner
    );
  }


  deletePartner(
    partnerId: string
  ): Observable<{
    message: string;
    deleted: boolean;
    deactivated: boolean;
    data: Partner;
  }> {

    return this.http.delete<{
      message: string;
      deleted: boolean;
      deactivated: boolean;
      data: Partner;
    }>(
      `${this.baseUrl}/partners/${partnerId}`
    );
  }

}