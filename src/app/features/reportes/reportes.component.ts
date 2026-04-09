import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { ReporteStore } from './reporte.store';
import { FiltrosReporteComponent } from './components/filtros-reporte/filtros-reporte.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { TablaTransaccionesComponent } from './components/tabla-transacciones/tabla-transacciones.component';
import { TabReporte, FiltrosReporte } from '../../core/models/reporte.models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    FiltrosReporteComponent,
    KpiCardsComponent,
    TablaTransaccionesComponent,
  ],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReporteStore],
})
export class ReportesComponent implements OnInit {
  protected readonly store = inject(ReporteStore);

  readonly tabs: { id: TabReporte; label: string; icon: string }[] = [
    { id: 'resumen',       label: 'Resumen',       icon: '📊' },
    { id: 'ingresos',      label: 'Ingresos',      icon: '💰' },
    { id: 'transacciones', label: 'Transacciones', icon: '🧾' },
    { id: 'horas-pico',    label: 'Horas Pico',    icon: '⏱' },
    { id: 'tipos',         label: 'Vehículos',     icon: '🚗' },
    { id: 'programados',   label: 'Programados',   icon: '📅' },
  ];

  ngOnInit(): void {
    this.store.inicializar();
  }

  onCambiarTab(tab: TabReporte): void {
    this.store.cambiarTab(tab);
  }

  onFiltrosChange(filtros: Partial<FiltrosReporte>): void {
    this.store.actualizarFiltros(filtros);
    this.store.cargarDatosPorTab(this.store.tabActiva());
  }

  onExportar(evento: { formato: 'csv' | 'xlsx' | 'pdf' }): void {
    const tabToTipo: Record<string, string> = {
      resumen: 'daily_revenue',
      ingresos: 'daily_revenue',
      transacciones: 'transactions',
      horas_pico: 'peak_hours',
      tipos: 'vehicle_type_mix',
    };
    const tab  = this.store.tabActiva();
    const tipo = (tabToTipo[tab] ?? 'daily_revenue') as any;
    this.store.exportar(tipo, evento.formato);
  }

  onEliminarProgramacion(id: number): void {
    this.store.eliminarProgramacion(id);
  }
}
