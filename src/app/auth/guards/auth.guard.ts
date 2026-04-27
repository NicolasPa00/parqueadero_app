import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../data-access/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;

  router.navigate(['/acceso']);
  return false;
};

/**
 * Bloquea el acceso a rutas de funcionalidad si el negocio no tiene plan activo.
 * Permite siempre: dashboard, acceso, sin-plan.
 */
export const planGuard: CanActivateFn = (_route, state) => {
  const auth      = inject(AuthService);
  const router    = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) return true;

  const path = state.url.split('?')[0].replace(/^\//, '');
  if (!path || path === 'dashboard' || path === 'acceso' || path === 'sin-plan') {
    return true;
  }

  if (auth.planActivo()) return true;
  return router.parseUrl('/sin-plan');
};
