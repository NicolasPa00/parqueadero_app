import { Routes } from '@angular/router';
import { authGuard, planGuard } from './auth/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent),
  },
  {
    path: 'acceso',
    loadComponent: () =>
      import('./features/sin-acceso/sin-acceso.component').then(m => m.SinAccesoComponent),
  },
  {
    path: 'salida-qr/:token',
    loadComponent: () =>
      import('./features/salida-qr/salida-qr.component').then(m => m.SalidaQrComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Inicio',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'vehiculos',
        title: 'Control de Vehículos',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/vehiculos/vehiculos.component').then(m => m.VehiculosComponent),
      },
      {
        path: 'tarifas',
        title: 'Tarifas',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/tarifas/tarifas.component').then(m => m.TarifasComponent),
      },
      {
        path: 'caja',
        title: 'Caja',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/caja/caja.component').then(m => m.CajaComponent),
      },
      {
        path: 'abonados',
        title: 'Abonados',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/abonados/abonados.component').then(m => m.AbonadosComponent),
      },
      {
        path: 'reportes',
        title: 'Reportes',
        canActivate: [planGuard],
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(m => m.ReportesComponent),
      },
      {
        path: 'configuracion',
        title: 'Configuración',
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
