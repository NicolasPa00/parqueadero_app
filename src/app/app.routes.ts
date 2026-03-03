import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    // Entrada automática desde el admin_app via código de acceso de un solo uso
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    // Página informativa cuando el usuario llega sin autenticarse
    path: 'acceso',
    loadComponent: () =>
      import('./features/sin-acceso/sin-acceso.component').then(m => m.SinAccesoComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'vehiculos',
        loadComponent: () =>
          import('./features/vehiculos/vehiculos.component').then(m => m.VehiculosComponent),
      },
      {
        path: 'tarifas',
        loadComponent: () =>
          import('./features/tarifas/tarifas.component').then(m => m.TarifasComponent),
      },
      {
        path: 'caja',
        loadComponent: () =>
          import('./features/caja/caja.component').then(m => m.CajaComponent),
      },
      {
        path: 'abonados',
        loadComponent: () =>
          import('./features/abonados/abonados.component').then(m => m.AbonadosComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'acceso' },
];
