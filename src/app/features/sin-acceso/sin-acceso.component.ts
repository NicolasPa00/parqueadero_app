import { Component } from '@angular/core';

@Component({
  selector: 'app-sin-acceso',
  standalone: true,
  template: `
    <div class="sa">
      <div class="sa__card">
        <div class="sa__icon">🅿️</div>
        <h1 class="sa__title">Parqueadero</h1>
        <p class="sa__desc">
          Para acceder a este módulo, ingresa desde el
          panel de administración de <strong>EscalApp</strong>.
        </p>
        <a href="http://localhost:4002/admin/dashboard" class="btn btn--primary sa__btn">
          Ir al panel de administración
        </a>
      </div>
    </div>
  `,
  styles: [`
    .sa {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-primary);
    }
    .sa__card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      padding: 3rem 3.5rem;
      max-width: 420px;
      text-align: center;
      box-shadow: var(--shadow-lg);
    }
    .sa__icon { font-size: 3rem; line-height: 1; }
    .sa__title {
      font-size: var(--font-size-2xl);
      font-weight: 800;
      color: var(--color-text-primary);
      margin: 0;
    }
    .sa__desc {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0;
      line-height: 1.6;
    }
    .sa__btn { margin-top: 0.5rem; width: 100%; }
  `],
})
export class SinAccesoComponent {}
