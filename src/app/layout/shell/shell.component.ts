import { Component, inject, computed } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../auth/data-access/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, LucideAngularModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentYear = new Date().getFullYear();

  /** Iniciales del usuario para el avatar del chip del header. */
  protected readonly initials = computed(() => {
    const nombre = this.authService.usuario()?.nombre_completo?.trim();
    if (!nombre) return 'U';
    const parts = nombre.split(/\s+/);
    return `${parts[0]?.charAt(0) ?? ''}${parts[1]?.charAt(0) ?? ''}`.toUpperCase();
  });

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveTitle()),
    ),
    { initialValue: 'Dashboard' },
  );

  private resolveTitle(): string {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.title ?? 'Dashboard';
  }

  protected readonly fechaActual = computed(() => {
    const now = new Date();
    return now.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
}
