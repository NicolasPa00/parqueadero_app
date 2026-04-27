import { Routes } from '@angular/router';
import { authGuard, planGuard } from './auth/guards/auth.guard';
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
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculos.component').then(m => m.VehiculosComponent),
      },
      {
        path: 'tarifas',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/tarifas/tarifas.component').then(m => m.TarifasComponent),
      },
      {
        path: 'caja',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/caja/caja.component').then(m => m.CajaComponent),
      },
      {
        path: 'abonados',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/abonados/abonados.component').then(m => m.AbonadosComponent),
      },
      {
        path: 'reportes',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
      },
      {
        path: 'configuracion',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
      },
      {
        path: 'sin-plan',
        loadComponent: () =>
          import('./features/sin-plan/sin-plan.component').then(m => m.SinPlanComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'acceso' },
];
