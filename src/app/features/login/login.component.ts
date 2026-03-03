import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/data-access/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);

  protected readonly token = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected onSubmit(): void {
    const t = this.token().trim();
    if (!t) {
      this.error.set('Ingrese el token de acceso');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.verificarToken(t).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message || 'Token inválido');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Error al verificar el token');
      },
    });
  }

  protected updateToken(event: Event): void {
    this.token.set((event.target as HTMLInputElement).value);
    this.error.set(null);
  }
}
