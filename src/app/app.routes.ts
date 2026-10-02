import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },

  {
    path: 'sales',
    loadComponent: () =>
      import('./pages/sales/sales').then(
        (m) => m.Sales
      ),
  },
];