import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  LayoutDashboard,
  Car,
  Receipt,
  Wallet,
  UserCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  SquareParking,
} from 'lucide-angular';
import { AuthService } from '../../auth/data-access/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { NavItem } from '../../core/models/parqueadero.models';

const NAV_ITEMS: NavItem[] = [
  { id: 210, label: 'Dashboard',            icon: 'layout-dashboard', route: '/dashboard' },
  { id: 220, label: 'Control de vehículos', icon: 'car',              route: '/vehiculos' },
  { id: 230, label: 'Tarifas',              icon: 'receipt',          route: '/tarifas' },
  { id: 240, label: 'Caja',                 icon: 'wallet',           route: '/caja' },
  { id: 233, label: 'Abonados',             icon: 'user-check',       route: '/abonados' },
  { id: 260, label: 'Reportes',             icon: 'bar-chart-3',      route: '/reportes' },
  { id: 270, label: 'Configuración',        icon: 'settings',         route: '/configuracion' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutDashboard, Car, Receipt, Wallet, UserCheck, BarChart3,
        Settings, LogOut, Menu, ChevronLeft, ChevronRight, Sun, Moon, SquareParking,
      }),
    },
  ],
})
export class ShellComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected readonly navItems = NAV_ITEMS;
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  protected readonly negocioNombre = computed(
    () => this.authService.negocio()?.nombre ?? 'Parqueadero'
  );
  protected readonly usuarioNombre = computed(
    () => this.authService.usuario()?.nombre_completo ?? ''
  );

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
