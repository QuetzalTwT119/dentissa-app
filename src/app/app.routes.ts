import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/sala',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'sala',
        data: { vista: 'plano' },
        loadComponent: () =>
          import('./pages/sala/sala.page').then((m) => m.SalaPage),
      },
      {
        path: 'qr',
        loadComponent: () =>
          import('./pages/qr-acceso/qr-acceso.page').then((m) => m.QrAccesoPage),
      },
      {
        path: 'estadisticas',
        canActivate: [roleGuard(['super_admin'])],
        data: { vista: 'stats' },
        loadComponent: () =>
          import('./pages/sala/sala.page').then((m) => m.SalaPage),
      },
      {
        path: 'auditoria',
        canActivate: [roleGuard(['super_admin'])],
        data: { vista: 'auditoria' },
        loadComponent: () =>
          import('./pages/sala/sala.page').then((m) => m.SalaPage),
      },
      {
        path: '',
        redirectTo: 'sala',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'tabs/sala',
  },
];