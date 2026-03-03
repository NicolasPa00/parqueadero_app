import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // auth/callback DEBE renderizarse en el cliente:
  // El código de un solo uso se consume via HTTP y el token se guarda en
  // localStorage. Si SSR lo ejecuta, el código se consume pero el token
  // no persiste al browser (no hay localStorage en el servidor).
  { path: 'auth/callback', renderMode: RenderMode.Client },
  { path: '**',            renderMode: RenderMode.Server },
];
