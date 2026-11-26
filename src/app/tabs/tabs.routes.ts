import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'acceso-qr',
        loadComponent: () =>
          import('../pages/acceso-qr/acceso-qr.page').then(
            (m) => m.AccesoQrPage
          ),
      },
      {
        path: 'control-manual',
        loadComponent: () =>
          import('../pages/control-manual/control-manual.page').then(
            (m) => m.ControlManualPage
          ),
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('../pages/auditoria/auditoria.page').then(
            (m) => m.AuditoriaPage
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
