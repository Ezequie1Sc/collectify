import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ApiService
} from '../../core/services/api';


interface EarningsSummary {
  total_sales: number;
  total_cost: number;
  total_profit: number;
  total_transactions: number;
  total_items_sold: number;
}


interface PartnerEarning {
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


interface EarningsCalculation {
  cost_basis: string;
  is_estimate: boolean;
  partner_basis: string;
  legacy_partner_fallback: string;
}


interface EarningsResponse {
  summary: EarningsSummary;
  partners: PartnerEarning[];
  calculation: EarningsCalculation;
}


@Component({
  selector: 'app-earnings',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './earnings.html',
  styleUrl: './earnings.scss'
})
export class Earnings implements OnInit {

  private readonly api = inject(ApiService);


  // =========================================================
  // STATE
  // =========================================================

  loading = true;

  error = '';

  earnings: EarningsResponse | null = null;


  // =========================================================
  // GETTERS
  // =========================================================

  get summary(): EarningsSummary | null {
    return this.earnings?.summary ?? null;
  }


  get partners(): PartnerEarning[] {
    return this.earnings?.partners ?? [];
  }


  get activePartners(): PartnerEarning[] {
    return this.partners.filter(
      partner => partner.is_active
    );
  }


  get totalProfit(): number {
    return this.summary?.total_profit ?? 0;
  }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadEarnings();
  }


  // =========================================================
  // LOAD EARNINGS
  // =========================================================

  loadEarnings(): void {

    this.loading = true;
    this.error = '';

    this.api.getEarnings().subscribe({

      next: (response: EarningsResponse) => {

        this.earnings = response;

        this.loading = false;
      },

      error: (error) => {

        console.error(
          'Error al cargar ganancias:',
          error
        );

        this.error =
          'No se pudieron cargar las ganancias.';

        this.loading = false;
      }

    });
  }


  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'es-MX',
      {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
      }
    ).format(value);
  }


  // =========================================================
  // PARTNER PROFIT PERCENTAGE
  // =========================================================

  getProfitPercentage(
    profit: number
  ): number {

    if (!this.totalProfit) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (profit / this.totalProfit) * 100
      )
    );
  }


  // =========================================================
  // PROFIT MARGIN
  // =========================================================

  getProfitMargin(
    sales: number,
    profit: number
  ): number {

    if (!sales) {
      return 0;
    }

    return (profit / sales) * 100;
  }


  // =========================================================
  // REFRESH
  // =========================================================

  refresh(): void {
    this.loadEarnings();
  }

}