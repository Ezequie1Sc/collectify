// =========================================================
// SUPPLIER REQUEST
// =========================================================

export interface SupplierRequest {

  product: string;

  category?: string;

  location?: string;

}


// =========================================================
// SUPPLIER RESULT
// =========================================================

export interface SupplierResult {

  name: string;

  description: string;

  category: string;

  location: string;

  website: string;

  rating: number;

  relevance: number;

  verified: boolean;

  tags: string[];

}


// =========================================================
// SUPPLIER RESPONSE
// =========================================================

export interface SupplierResponse {

  product: string;

  category?: string;

  location?: string;

  query: string;

  total_results: number;

  answer: string;

  results: SupplierResult[];

}