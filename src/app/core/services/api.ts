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


// =========================================================
// MODELS
// =========================================================

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

import {
  AIRequest,
  AIResponse
} from '../models/ai';

import {
  SupplierRequest,
  SupplierResponse
} from '../models/supplier';


// =========================================================
// API SERVICE
// =========================================================

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  // =======================================================
  // HTTP
  // =======================================================

  private readonly http =
    inject(HttpClient);


  // =======================================================
  // BASE URL
  // =======================================================

  /*
   * LOCAL
   *
   * Para trabajar con FastAPI local:
   *
   * http://127.0.0.1:8000
   */

  private readonly baseUrl =
    'https://collectify-api-udxk.onrender.com';


  /*
   * RENDER
   *
   * Cuando vayas a producción cambia únicamente
   * la línea anterior por:
   *
   * https://collectify-api-udxk.onrender.com
   *
   */


  // =======================================================
  // PRODUCTS
  // =======================================================

  getProducts():
    Observable<ProductsResponse> {

    console.log(
      '[API] GET /products'
    );

    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products`
    );
  }


  // =======================================================
  // PRODUCTS BY OWNER
  // =======================================================

  getProductsByOwner(
    ownerId: string
  ):
    Observable<ProductsResponse> {

    console.log(
      '[API] GET /products/',
      ownerId
    );

    return this.http.get<ProductsResponse>(
      `${this.baseUrl}/products/${ownerId}`
    );
  }


  // =======================================================
  // CREATE PRODUCT
  // =======================================================

  createProduct(
    product: ProductCreate
  ):
    Observable<ProductResponse> {

    console.log(
      '[API] POST /products',
      product
    );

    return this.http.post<ProductResponse>(
      `${this.baseUrl}/products`,
      product
    );
  }


  // =======================================================
  // UPDATE PRODUCT
  // =======================================================

  updateProduct(
    productId: string,
    product: ProductUpdate
  ):
    Observable<ProductResponse> {

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


  // =======================================================
  // DELETE PRODUCT
  // =======================================================

  deleteProduct(
    productId: string
  ):
    Observable<{
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


  // =======================================================
  // SALES
  // =======================================================

  createSale(
    sale: SaleCreate
  ):
    Observable<SaleResponse> {

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


  // =======================================================
  // PARTNERS
  // =======================================================

  getPartners():
    Observable<PartnersResponse> {

    console.log(
      '[API] GET /partners'
    );

    return this.http.get<PartnersResponse>(
      `${this.baseUrl}/partners`
    );
  }


  // =======================================================
  // CREATE PARTNER
  // =======================================================

  createPartner(
    partner: PartnerCreate
  ):
    Observable<PartnerResponse> {

    console.log(
      '[API] POST /partners',
      partner
    );

    return this.http.post<PartnerResponse>(
      `${this.baseUrl}/partners`,
      partner
    );
  }


  // =======================================================
  // UPDATE PARTNER
  // =======================================================

  updatePartner(
    partnerId: string,
    partner: PartnerUpdate
  ):
    Observable<PartnerResponse> {

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


  // =======================================================
  // DELETE PARTNER
  // =======================================================

  deletePartner(
    partnerId: string
  ):
    Observable<{
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


  // =======================================================
  // EARNINGS
  // =======================================================

  getEarnings():
    Observable<EarningsResponse> {

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


  // =======================================================
  // AI ANALYSIS
  // =======================================================

  analyzeWithAI(
    question: string
  ):
    Observable<AIResponse> {

    console.log(
      '[API] POST /ai/analyze'
    );

    const body: AIRequest = {
      question
    };

    console.log(
      '[API] Pregunta enviada:',
      body
    );

    return this.http.post<AIResponse>(
      `${this.baseUrl}/ai/analyze`,
      body
    );
  }


  // =======================================================
  // AI - SEARCH SUPPLIERS
  // =======================================================

  searchSuppliers(
    request: SupplierRequest
  ):
    Observable<SupplierResponse> {

    console.log(
      '[API] POST /ai/suppliers'
    );

    console.log(
      '[API] Solicitud de proveedores:',
      request
    );

    return this.http.post<SupplierResponse>(
      `${this.baseUrl}/ai/suppliers`,
      request
    );
  }

}