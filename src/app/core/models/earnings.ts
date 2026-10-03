// =========================================================
// EARNINGS SUMMARY
// =========================================================

export interface EarningsSummary {
  total_sales: number;
  total_cost: number;
  total_profit: number;
  total_transactions: number;
  total_items_sold: number;
}


// =========================================================
// PARTNER EARNINGS
// =========================================================

export interface PartnerEarnings {
  partner_id: string;
  partner_name: string;
  email: string | null;
  is_active: boolean;

  products_sold: number;
  sales: number;
  cost: number;
  profit: number;
  total_transactions: number;
}


// =========================================================
// EARNINGS CALCULATION
// =========================================================

export interface EarningsCalculation {
  cost_basis: string;
  is_estimate: boolean;
  partner_basis: string;
  legacy_partner_fallback: string;
}


// =========================================================
// EARNINGS RESPONSE
// =========================================================

export interface EarningsResponse {
  summary: EarningsSummary;
  partners: PartnerEarnings[];
  calculation: EarningsCalculation;
}