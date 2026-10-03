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


  // =========================================================
  // BASE URL
  // =========================================================

  private readonly baseUrl =
    'http://127.0.0.1:8000';


  // =========================================================
  // PRODUCTS
  // =========================================================

  /**
   * Obtiene todos los productos activos.
   *
   * El inventario es compartido entre
   * todos los socios.
   */
  getProducts(): Observable<ProductsResponse> {

    console.log(
      '[API] GET /products'
    );

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

    console.log(
      '[API] GET /products/',
      ownerId
    );

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

    console.log(
      '[API] POST /products',
      product
    );

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

    console.log(
      '[API] PATCH /products/',
      productId,
      product
    );

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

    console.log(
      '[API] DELETE /products/',
      productId
    );

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

  /**
   * Registra una nueva venta.
   *
   * El backend:
   *
   * - valida el socio
   * - valida los productos
   * - valida el stock
   * - calcula el total
   * - registra la venta
   * - registra los productos vendidos
   * - actualiza el stock
   * - genera el ticket
   */
  createSale(
    sale: SaleCreate
  ): Observable<SaleResponse> {

    console.log(
      '[API] POST /sales'
    );

    console.log(
      '[API] Venta enviada:',
      sale
    );

    return this.http.post<SaleResponse>(
      `${this.baseUrl}/sales`,
      sale
    );

  }


  // =========================================================
  // PARTNERS
  // =========================================================

  /**
   * Obtiene todos los socios.
   */
  getPartners(): Observable<PartnersResponse> {

    console.log(
      '[API] GET /partners'
    );

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

    console.log(
      '[API] POST /partners',
      partner
    );

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

    console.log(
      '[API] PATCH /partners/',
      partnerId,
      partner
    );

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

    console.log(
      '[API] DELETE /partners/',
      partnerId
    );

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
   * Obtiene:
   *
   * - ventas totales
   * - costos totales
   * - ganancias totales
   * - número de transacciones
   * - productos vendidos
   * - ganancias por socio
   * - información del cálculo
   */
  getEarnings(): Observable<EarningsResponse> {

    console.log(
      '[API] GET /earnings'
    );

    const url =
      `${this.baseUrl}/earnings`;

    console.log(
      '[API] URL:',
      url
    );

    return this.http.get<EarningsResponse>(
      url
    );

  }

}