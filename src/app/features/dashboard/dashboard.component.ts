import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Car,
  Gauge,
  Banknote,
  ArrowLeftRight,
  CreditCard,
} from 'lucide-angular';
import { AuthService } from '../../auth/data-access/auth.service';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { DashboardKpis, UltimoVehiculo } from '../../core/models/parqueadero.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, DatePipe, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Car, Gauge, Banknote, ArrowLeftRight, CreditCard }),
    },
  ],
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly parqService = inject(ParqueaderoService);

  readonly planActivo = computed(() => this.authService.planActivo());
  protected readonly loading = signal(true);
  protected readonly kpis = signal<DashboardKpis>({
    vehiculos_actuales: 0,
    capacidad_total: 0,
    ocupacion_porcentaje: 0,
    ingresos_hoy: 0,
    entradas_hoy: 0,
    salidas_hoy: 0,
  });
  protected readonly ultimosVehiculos = signal<UltimoVehiculo[]>([]);

  ngOnInit(): void {
    const negocio = this.authService.negocio();
    if (!negocio) return;

    this.parqService.getDashboard(negocio.id_negocio).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.kpis.set(res.data.kpis);
          this.ultimosVehiculos.set(res.data.ultimos_vehiculos);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
