import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  finalize,
  timeout
} from 'rxjs';

import {
  Header
} from '../../components/header/header';

import {
  ApiService
} from '../../core/services/api';

import {
  EarningsResponse,
  EarningsSummary,
  PartnerEarnings
} from '../../core/models/earnings';


interface FinancialBar {
  label: string;
  value: number;
  type: 'sales' | 'cost' | 'profit';
}


@Component({
  selector: 'app-earnings',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    Header
  ],

  templateUrl: './earnings.html',
  styleUrl: './earnings.scss'
})
export class Earnings implements OnInit {

  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currencyFormatter = new Intl.NumberFormat(
    'es-MX',
    {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );


  // =======================================================
  // STATE
  // =======================================================

  loading = false;
  error = '';

  earnings: EarningsResponse | null = null;
  lastUpdated: Date | null = null;

  search = '';


  // =======================================================
  // SUMMARY
  // =======================================================

  get summary(): EarningsSummary | null {
    return this.earnings?.summary ?? null;
  }

  get partners(): PartnerEarnings[] {
    return this.earnings?.partners ?? [];
  }

  get activePartners(): PartnerEarnings[] {
    return this.partners.filter(partner => partner.is_active);
  }

  get partnersWithSales(): number {
    return this.partners.filter(partner =>
      this.toNumber(partner.total_transactions) > 0 ||
      this.toNumber(partner.products_sold) > 0
    ).length;
  }

  get totalProfit(): number {
    return this.toNumber(this.summary?.total_profit);
  }

  get totalSales(): number {
    return this.toNumber(this.summary?.total_sales);
  }

  get totalCost(): number {
    return this.toNumber(this.summary?.total_cost);
  }

  get totalTransactions(): number {
    return this.toNumber(this.summary?.total_transactions);
  }

  get totalItemsSold(): number {
    return this.toNumber(this.summary?.total_items_sold);
  }

  get averageTicket(): number | null {
    return this.totalTransactions > 0
      ? this.totalSales / this.totalTransactions
      : null;
  }

  get profitMargin(): number | null {
    return this.getProfitMargin(
      this.totalSales,
      this.totalProfit
    );
  }


  // =======================================================
  // PARTNERS
  // =======================================================

  get filteredPartners(): PartnerEarnings[] {
    const query = this.normalize(this.search);

    return this.partners
      .filter(partner => {
        const text = this.normalize(
          `${partner.partner_name} ${partner.email ?? ''}`
        );

        return !query || text.includes(query);
      })
      .slice()
      .sort((a, b) =>
        this.toNumber(b.profit) - this.toNumber(a.profit)
      );
  }


  // =======================================================
  // CHART
  // =======================================================

  get financialBars(): FinancialBar[] {
    return [
      {
        label: 'Ventas',
        value: this.totalSales,
        type: 'sales'
      },
      {
        label: 'Costos',
        value: this.totalCost,
        type: 'cost'
      },
      {
        label: 'Ganancia',
        value: this.totalProfit,
        type: 'profit'
      }
    ];
  }

  get chartMaximum(): number {
    return Math.max(
      Math.abs(this.totalSales),
      Math.abs(this.totalCost),
      Math.abs(this.totalProfit)
    );
  }

  get hasFinancialValues(): boolean {
    return this.chartMaximum > 0;
  }

  get hasNegativeValues(): boolean {
    return this.financialBars.some(bar => bar.value < 0);
  }

  barWidth(value: number): number {
    if (this.chartMaximum === 0) {
      return 0;
    }

    const width = Math.min(
      100,
      Math.abs(value) / this.chartMaximum * 100
    );

    // Si hay valores negativos, el cero queda en el centro.
    return this.hasNegativeValues ? width / 2 : width;
  }

  barLeft(value: number): number {
    if (!this.hasNegativeValues) {
      return 0;
    }

    return value < 0
      ? 50 - this.barWidth(value)
      : 50;
  }


  // =======================================================
  // INIT / LOAD
  // =======================================================

  ngOnInit(): void {
    this.loadEarnings();
  }

  loadEarnings(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Conservamos la respuesta anterior durante la actualización.
    this.cdr.markForCheck();

    this.api
      .getEarnings()
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;

          if (!this.destroyRef.destroyed) {
            this.cdr.markForCheck();
          }
        })
      )
      .subscribe({
        next: (response: EarningsResponse) => {
          this.earnings = response;
          this.lastUpdated = new Date();
          this.error = '';

          this.cdr.markForCheck();
        },

        error: error => {
          this.error = this.readError(error);
          this.cdr.markForCheck();
        }
      });
  }

  refresh(): void {
    this.loadEarnings();
  }


  // =======================================================
  // FORMAT
  // =======================================================

  formatCurrency(value: unknown): string {
    return this.currencyFormatter.format(
      this.toNumber(value)
    );
  }

  getProfitMargin(
    sales: number,
    profit: number
  ): number | null {
    const totalSales = this.toNumber(sales);
    const totalProfit = this.toNumber(profit);

    // Sin ventas positivas, el margen no es calculable.
    return totalSales > 0
      ? totalProfit / totalSales * 100
      : null;
  }

  initials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase() || '?';
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private readError(error: unknown): string {
    const response = error as {
      name?: string;
      status?: number;
      error?: {
        detail?: unknown;
        message?: unknown;
      };
    };

    if (response?.name === 'TimeoutError') {
      return 'La consulta tardó demasiado. Intenta nuevamente.';
    }

    if (response?.status === 0) {
      return 'No se pudo conectar con el servidor. Intenta nuevamente en unos momentos.';
    }

    const detail = response?.error?.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }

    const message = response?.error?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return 'No se pudieron cargar las ganancias.';
  }
}