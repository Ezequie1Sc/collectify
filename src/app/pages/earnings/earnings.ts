import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  EMPTY
} from 'rxjs';

import {
  catchError,
  finalize,
  timeout
} from 'rxjs/operators';

import {
  ApiService
} from '../../core/services/api';

import {
  EarningsResponse,
  EarningsSummary,
  PartnerEarnings
} from '../../core/models/earnings';


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

  private readonly cdr = inject(ChangeDetectorRef);


  // =========================================================
  // STATE
  // =========================================================

  loading = false;

  error = '';

  earnings: EarningsResponse | null = null;


  // =========================================================
  // GETTERS
  // =========================================================

  get summary(): EarningsSummary | null {

    return this.earnings?.summary ?? null;

  }


  get partners(): PartnerEarnings[] {

    return this.earnings?.partners ?? [];

  }


  get activePartners(): PartnerEarnings[] {

    return this.partners.filter(
      partner => partner.is_active
    );

  }


  get totalProfit(): number {

    return this.summary?.total_profit ?? 0;

  }


  get totalSales(): number {

    return this.summary?.total_sales ?? 0;

  }


  get totalCost(): number {

    return this.summary?.total_cost ?? 0;

  }


  get totalTransactions(): number {

    return this.summary?.total_transactions ?? 0;

  }


  get totalItemsSold(): number {

    return this.summary?.total_items_sold ?? 0;

  }


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    console.log(
      '[EARNINGS] Componente inicializado'
    );

    this.loadEarnings();

  }


  // =========================================================
  // LOAD EARNINGS
  // =========================================================

  loadEarnings(): void {

    console.log(
      '[EARNINGS] Iniciando consulta...'
    );


    this.loading = true;

    this.error = '';

    /*
     * NO ponemos earnings = null aquí.
     *
     * Si ya tenemos información y el usuario pulsa
     * "Actualizar", conservamos los datos mientras
     * llega la nueva respuesta.
     */


    this.cdr.detectChanges();


    this.api.getEarnings()
      .pipe(

        timeout(10000),


        catchError((error) => {

          console.error(
            '[EARNINGS] Error:',
            error
          );


          if (
            error?.name === 'TimeoutError'
          ) {

            this.error =
              'El servidor tardó demasiado en responder.';

          } else if (
            error?.status === 0
          ) {

            this.error =
              'No se pudo conectar con el servidor. Verifica que FastAPI esté ejecutándose.';

          } else if (
            error?.status
          ) {

            this.error =
              `Error del servidor (${error.status}).`;

          } else {

            this.error =
              'No se pudieron cargar las ganancias.';

          }


          return EMPTY;

        }),


        finalize(() => {

          console.log(
            '[EARNINGS] Consulta finalizada.'
          );


          this.loading = false;


          /*
           * Nos aseguramos de que Angular actualice
           * inmediatamente la vista.
           */
          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: (response: EarningsResponse) => {

          console.log(
            '[EARNINGS] Respuesta recibida:',
            response
          );


          this.earnings = response;

          this.error = '';

          /*
           * Actualizamos la vista inmediatamente.
           */
          this.cdr.detectChanges();

        },

        error: (error) => {

          /*
           * Este bloque es de respaldo.
           *
           * catchError normalmente evita que llegue aquí,
           * pero dejamos el estado consistente por seguridad.
           */

          console.error(
            '[EARNINGS] Error no controlado:',
            error
          );


          this.loading = false;

          this.error =
            'No se pudieron cargar las ganancias.';


          this.cdr.detectChanges();

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
    ).format(
      Number(value) || 0
    );

  }


  // =========================================================
  // PROFIT PERCENTAGE
  // =========================================================

  getProfitPercentage(
    profit: number
  ): number {

    if (
      !this.totalProfit ||
      this.totalProfit <= 0
    ) {

      return 0;

    }


    return Math.min(
      100,
      Math.max(
        0,
        (
          Number(profit) /
          this.totalProfit
        ) * 100
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

    if (
      !sales ||
      sales <= 0
    ) {

      return 0;

    }


    return (
      Number(profit) /
      Number(sales)
    ) * 100;

  }


  // =========================================================
  // REFRESH
  // =========================================================

  refresh(): void {

    console.log(
      '[EARNINGS] Actualización manual'
    );

    this.loadEarnings();

  }

}