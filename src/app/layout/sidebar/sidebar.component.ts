import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, IsActiveMatchOptions } from '@angular/router';
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
  X,
  SquareParking,
  House,
} from 'lucide-angular';
import { AuthService } from '../../auth/data-access/auth.service';
import { NavItem } from '../../core/models/parqueadero.models';

const NAV_ITEMS: NavItem[] = [
  { id: 210, label: 'Inicio',               icon: 'layout-dashboard', route: '/dashboard',      section: 'main' },
  { id: 220, label: 'Vehículos',            icon: 'car',              route: '/vehiculos',      section: 'main' },
  { id: 230, label: 'Tarifas',              icon: 'receipt',          route: '/tarifas',        section: 'main' },
  { id: 240, label: 'Caja',                 icon: 'wallet',           route: '/caja',           section: 'main' },
  { id: 233, label: 'Abonados',             icon: 'user-check',       route: '/abonados',       section: 'secondary' },
  { id: 260, label: 'Reportes',             icon: 'bar-chart-3',      route: '/reportes',       section: 'secondary' },
  { id: 270, label: 'Configuración',        icon: 'settings',         route: '/configuracion',  section: 'secondary' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutDashboard, Car, Receipt, Wallet, UserCheck, BarChart3,
        Settings, LogOut, Menu, X, SquareParking, House,
      }),
    },
  ],
})
export class SidebarComponent {
  readonly auth = inject(AuthService);

  readonly navItems = NAV_ITEMS;
  readonly mainItems = computed(() => this.navItems.filter(i => i.section === 'main'));
  readonly secondaryItems = computed(() => this.navItems.filter(i => i.section === 'secondary'));

  readonly exactMatchOptions: IsActiveMatchOptions = {
    paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
  };
  readonly prefixMatchOptions: IsActiveMatchOptions = {
    paths: 'subset', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored',
  };

  readonly moreMenuOpen = signal(false);

  toggleMoreMenu(): void {
    this.moreMenuOpen.update(v => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  onLogout(): void {
    this.auth.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.moreMenuOpen()) {
      this.closeMoreMenu();
    }
  }
}
