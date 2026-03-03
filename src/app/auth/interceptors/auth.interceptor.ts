import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../data-access/auth.service';

const PUBLIC_URLS = ['/auth/verificar-token'];

function isPublicUrl(url: string): boolean {
  return PUBLIC_URLS.some((pub) => url.includes(pub));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  if (isPublicUrl(req.url)) return next(req);

  const token = authService.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) authService.logout();
      return throwError(() => error);
    }),
  );
};
