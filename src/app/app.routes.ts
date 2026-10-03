import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  // =========================================================
  // DASHBOARD
  // =========================================================

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(
          (m) => m.Dashboard
        ),
  },

  // =========================================================
  // SALES
  // =========================================================

  {
    path: 'sales',
    loadComponent: () =>
      import('./pages/sales/sales')
        .then(
          (m) => m.Sales
        ),
  },

  // =========================================================
  // PARTNERS
  // =========================================================

  {
    path: 'partners',
    loadComponent: () =>
      import('./pages/partners/partners')
        .then(
          (m) => m.Partners
        ),
  },

  // =========================================================
  // EARNINGS
  // =========================================================

  {
    path: 'earnings',
    loadComponent: () =>
      import('./pages/earnings/earnings')
        .then(
          (m) => m.Earnings
        ),
  },

];