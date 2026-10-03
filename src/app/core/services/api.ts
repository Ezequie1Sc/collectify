import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

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

import {
  EarningsResponse
} from '../models/earnings';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly http =
    inject(HttpClient);

  private readonly baseUrl =
    'http://127.0.0.1:8000';


  // =========================================================
  // PRODUCTS
  // =========================================================

  /**
   * Obtiene TODOS los productos activos.
   *
   * El Dashboard utiliza este método
   * porque el inventario es compartido
   * entre todos los socios.
   */
  getProducts(): Observable<ProductsResponse> {

    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products`
    );
  }


  /**
   * Obtiene los productos de un socio específico.
   */
  getProductsByOwner(
    ownerId: string
  ): Observable<ProductsResponse> {

    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products/${ownerId}`
    );
  }


  // =========================================================
  // CREATE PRODUCT
  // =========================================================

  createProduct(
    product: ProductCreate
  ): Observable<ProductResponse> {

    return this.http.post<ProductResponse>(
      `${this.baseUrl}/products`,
      product
    );
  }


  // =========================================================
  // UPDATE PRODUCT
  // =========================================================

  updateProduct(
    productId: string,
    product: ProductUpdate
  ): Observable<ProductResponse> {

    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/products/${productId}`,
      product
    );
  }


  // =========================================================
  // DELETE PRODUCT
  // =========================================================

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


  // =========================================================
  // CREATE PARTNER
  // =========================================================

  createPartner(
    partner: PartnerCreate
  ): Observable<PartnerResponse> {

    return this.http.post<PartnerResponse>(
      `${this.baseUrl}/partners`,
      partner
    );
  }


  // =========================================================
  // UPDATE PARTNER
  // =========================================================

  updatePartner(
    partnerId: string,
    partner: PartnerUpdate
  ): Observable<PartnerResponse> {

    return this.http.patch<PartnerResponse>(
      `${this.baseUrl}/partners/${partnerId}`,
      partner
    );
  }


  // =========================================================
  // DELETE PARTNER
  // =========================================================

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


  // =========================================================
  // EARNINGS
  // =========================================================

  /**
   * Obtiene el resumen general de ganancias
   * y el desglose de ganancias por socio.
   */
  getEarnings(): Observable<EarningsResponse> {

    return this.http.get<EarningsResponse>(
      `${this.baseUrl}/earnings`
    );
  }

}