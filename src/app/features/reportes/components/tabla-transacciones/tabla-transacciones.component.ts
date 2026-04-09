import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Transaccion, TransaccionesPaginadas } from '../../../../core/models/reporte.models';

export type SortDir = 'asc' | 'desc';

export interface SortState {
  campo: string;
  dir: SortDir;
}

@Component({
  selector: 'app-tabla-transacciones',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './tabla-transacciones.component.html',
  styleUrls: ['./tabla-transacciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaTransaccionesComponent {
  @Input() datos: TransaccionesPaginadas | null = null;
  @Input() cargando = false;

  @Output() cambiarPagina = new EventEmitter<number>();
  @Output() cambiarSort   = new EventEmitter<SortState>();
  @Output() exportar      = new EventEmitter<{ formato: 'csv' | 'xlsx' | 'pdf' }>();

  readonly sort = signal<SortState>({ campo: 'fecha_cierre', dir: 'desc' });

  readonly columnas = [
    { campo: 'numero_factura', label: 'Factura',      sortable: true  },
    { campo: 'placa',          label: 'Placa',         sortable: true  },
    { campo: 'tipo_vehiculo',  label: 'Tipo vehículo', sortable: false },
    { campo: 'fecha_entrada',  label: 'Entrada',       sortable: true  },
    { campo: 'fecha_cierre',   label: 'Salida',        sortable: true  },
    { campo: 'duracion_min',   label: 'Duración',      sortable: true  },
    { campo: 'valor_total',    label: 'Valor',         sortable: true  },
    { campo: 'estado',         label: 'Estado',        sortable: false },
  ];

  // ── Computed helpers ─────────────────────────────────────
  get paginaActual(): number    { return this.datos?.page  ?? 1; }
  get totalPaginas(): number    { return this.datos?.pages ?? 1; }
  get totalItems():   number    { return this.datos?.total ?? 0; }
  get filas():        Transaccion[] { return this.datos?.items ?? []; }

  hayPrev(): boolean { return this.paginaActual > 1; }
  hayNext(): boolean { return this.paginaActual < this.totalPaginas; }

  // ── Sort ─────────────────────────────────────────────────
  toggleSort(campo: string): void {
    const actual = this.sort();
    const nuevo: SortState = actual.campo === campo
      ? { campo, dir: actual.dir === 'asc' ? 'desc' : 'asc' }
      : { campo, dir: 'asc' };
    this.sort.set(nuevo);
    this.cambiarSort.emit(nuevo);
  }

  sortIcon(campo: string): string {
    const s = this.sort();
    if (s.campo !== campo) return '↕';
    return s.dir === 'asc' ? '↑' : '↓';
  }

  // ── Paginación ───────────────────────────────────────────
  irAPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas) return;
    this.cambiarPagina.emit(p);
  }

  // ── Helpers de display ───────────────────────────────────
  formatDuracion(minutos: number | null | undefined): string {
    if (minutos == null) return '—';
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = { A: 'badge--activa', C: 'badge--cerrada', X: 'badge--anulada' };
    return map[estado] ?? '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = { A: 'Activa', C: 'Cerrada', X: 'Anulada' };
    return map[estado] ?? estado;
  }

  emitirExportar(formato: 'csv' | 'xlsx' | 'pdf'): void {
    this.exportar.emit({ formato });
  }
}
