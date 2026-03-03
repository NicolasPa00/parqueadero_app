import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Car,
  Bike,
  Truck,
  Bus,
} from 'lucide-angular';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { AuthService } from '../../auth/data-access/auth.service';
import { Vehiculo, TipoVehiculo, Tarifa } from '../../core/models/parqueadero.models';

type Vista = 'actuales' | 'historial';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Car, Bike, Truck, Bus }),
    },
  ],
})
export class VehiculosComponent implements OnInit {
  private readonly svc = inject(ParqueaderoService);
  private readonly auth = inject(AuthService);

  // ── State ──
  vista = signal<Vista>('actuales');
  loading = signal(false);
  vehiculos = signal<Vehiculo[]>([]);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  tiposVehiculo = signal<TipoVehiculo[]>([]);
  tarifas = signal<Tarifa[]>([]);

  // ── Formulario de entrada ──
  showEntrada = signal(false);
  entradaPlaca = signal('');
  entradaTipo = signal<number | null>(null);
  entradaTarifa = signal<number | null>(null);
  entradaObs = signal('');
  savingEntrada = signal(false);

  // ── Salida modal ──
  showSalida = signal(false);
  vehiculoSalida = signal<Vehiculo | null>(null);
  salidaValor = signal<number>(0);
  savingSalida = signal(false);

  // ── Filtros ──
  filtroPlaca = signal('');
  filtroDesde = signal('');
  filtroHasta = signal('');

  // ── Computed ──
  tarifasFiltradas = computed(() => {
    const tipo = this.entradaTipo();
    if (!tipo) return [];
    return this.tarifas().filter(t => t.id_tipo_vehiculo === tipo);
  });

  // ── Tipo de vehículo → ícono Lucide ──
  readonly TIPO_ICON: Record<string, string> = {
    'automóvil':   'car',
    'motocicleta': 'bike',
    'bicicleta':   'bike',
    'camioneta':   'truck',
    'camión':      'truck',
    'minibús':     'bus',
    'bus':         'bus',
  };

  tipoIcono(nombre: string): string {
    return this.TIPO_ICON[nombre.toLowerCase()] ?? 'car';
  }

  private get idNeg(): number {
    return this.auth.negocio()?.id_negocio ?? 0;
  }

  ngOnInit(): void {
    this.loadTipos();
    this.loadTarifas();
    this.loadVehiculos();
  }

  // ── Data loading ──
  loadVehiculos(): void {
    this.loading.set(true);
    const neg = this.idNeg;
    const p = this.page();

    if (this.vista() === 'actuales') {
      this.svc.getVehiculosActuales(neg, p, this.filtroPlaca() || undefined).subscribe({
        next: res => {
          if (res.data) {
            this.vehiculos.set(res.data.vehiculos);
            this.total.set(res.data.total);
            this.totalPages.set(res.data.totalPages);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      const filters: { placa?: string; desde?: string; hasta?: string } = {};
      if (this.filtroPlaca()) filters.placa = this.filtroPlaca();
      if (this.filtroDesde()) filters.desde = this.filtroDesde();
      if (this.filtroHasta()) filters.hasta = this.filtroHasta();
      this.svc.getHistorialVehiculos(neg, p, filters).subscribe({
        next: res => {
          if (res.data) {
            this.vehiculos.set(res.data.vehiculos);
            this.total.set(res.data.total);
            this.totalPages.set(res.data.totalPages);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  loadTipos(): void {
    this.svc.getTiposVehiculo(this.idNeg).subscribe({
      next: res => {
        if (res.data) this.tiposVehiculo.set(res.data);
      },
    });
  }

  loadTarifas(): void {
    this.svc.getTarifas(this.idNeg).subscribe({
      next: res => {
        if (res.data) this.tarifas.set(res.data);
      },
    });
  }

  // ── Vista ──
  cambiarVista(v: Vista): void {
    this.vista.set(v);
    this.page.set(1);
    this.filtroPlaca.set('');
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.loadVehiculos();
  }

  buscar(): void {
    this.page.set(1);
    this.loadVehiculos();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadVehiculos();
  }

  // ── Entrada ──
  abrirEntrada(): void {
    this.showEntrada.set(true);
    this.entradaPlaca.set('');
    this.entradaTipo.set(this.tiposVehiculo().length ? this.tiposVehiculo()[0].id_tipo_vehiculo : null);
    this.entradaTarifa.set(null);
    this.entradaObs.set('');
  }

  cerrarEntrada(): void {
    this.showEntrada.set(false);
  }

  guardarEntrada(): void {
    const placa = this.entradaPlaca().trim().toUpperCase();
    const tipo = this.entradaTipo();
    if (!placa || !tipo) return;

    this.savingEntrada.set(true);
    this.svc.registrarEntrada({
      placa,
      id_tipo_vehiculo: tipo,
      id_negocio: this.idNeg,
      id_tarifa: this.entradaTarifa() ?? undefined,
      observaciones: this.entradaObs() || undefined,
    }).subscribe({
      next: () => {
        this.savingEntrada.set(false);
        this.cerrarEntrada();
        this.loadVehiculos();
      },
      error: () => this.savingEntrada.set(false),
    });
  }

  // ── Salida ──
  abrirSalida(v: Vehiculo): void {
    this.vehiculoSalida.set(v);
    this.salidaValor.set(v.tarifa?.valor ?? 0);
    this.showSalida.set(true);
  }

  cerrarSalida(): void {
    this.showSalida.set(false);
    this.vehiculoSalida.set(null);
  }

  guardarSalida(): void {
    const v = this.vehiculoSalida();
    if (!v) return;

    this.savingSalida.set(true);
    this.svc.registrarSalida(v.id_vehiculo, this.idNeg, this.salidaValor()).subscribe({
      next: () => {
        this.savingSalida.set(false);
        this.cerrarSalida();
        this.loadVehiculos();
      },
      error: () => this.savingSalida.set(false),
    });
  }

  // ── Helpers ──
  tiempoTranscurrido(fecha: string): string {
    const diff = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs}h ${m}m`;
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
  }
}
