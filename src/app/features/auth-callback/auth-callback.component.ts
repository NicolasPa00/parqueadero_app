import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser }  from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/data-access/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="callback">
      @if (error()) {
        <div class="callback__card">
          <span class="callback__icon callback__icon--error">✕</span>
          <h2 class="callback__title">Acceso denegado</h2>
          <p class="callback__msg">{{ error() }}</p>
          <a href="/acceso" class="btn btn--primary">Volver al inicio</a>
        </div>
      } @else {
        <div class="callback__card">
          <div class="callback__spinner"></div>
          <p class="callback__msg">Verificando acceso al parqueadero…</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .callback {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
    }
    .callback__card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 2.5rem 3rem;
      max-width: 380px;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }
    .callback__icon--error {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: var(--color-danger, #ef4444);
      color: #fff;
      font-size: 1.4rem;
      display: flex; align-items: center; justify-content: center;
    }
    .callback__title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }
    .callback__msg {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }
    .callback__spinner {
      width: 44px; height: 44px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route       = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly platformId  = inject(PLATFORM_ID);

  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // Solo ejecutar en el browser — en SSR no hay localStorage
    // ni código de un solo uso disponible para consumir.
    if (!isPlatformBrowser(this.platformId)) return;

    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.error.set('No se recibió un código de acceso válido.');
      return;
    }

    this.authService.canjearCodigo(code).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        } else {
          this.error.set(res.message || 'Código inválido o expirado.');
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Error al verificar el acceso.';
        this.error.set(msg);
      },
    });
  }
}
