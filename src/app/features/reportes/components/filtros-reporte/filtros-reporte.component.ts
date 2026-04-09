import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiltrosReporte, Granularidad } from '../../../../core/models/reporte.models';

export interface RangoPreset {
  label: string;
  desde: string;
  hasta: string;
}

@Component({
  selector: 'app-filtros-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtros-reporte.component.html',
  styleUrls: ['./filtros-reporte.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrosReporteComponent implements OnChanges {
  @Input() filtros!: FiltrosReporte;
  @Input() mostrarExportar = true;

  @Output() filtrosChange = new EventEmitter<Partial<FiltrosReporte>>();
  @Output() exportar     = new EventEmitter<{ formato: 'csv' | 'xlsx' | 'pdf' }>();

  // ── Local editable copy ──────────────────────────────────
  readonly desde     = signal('');
  readonly hasta     = signal('');
  readonly granularidad = signal<Granularidad>('daily');
  readonly presetActivo = signal<string>('');

  readonly granularidades: { value: Granularidad; label: string }[] = [
    { value: 'hourly',  label: 'Por hora'   },
    { value: 'daily',   label: 'Por día'    },
    { value: 'weekly',  label: 'Por semana' },
    { value: 'monthly', label: 'Por mes'    },
  ];

  readonly presets: RangoPreset[] = this._buildPresets();

  // ── Lifecycle ────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtros'] && this.filtros) {
      this.desde.set(this.filtros.fechaDesde ?? '');
      this.hasta.set(this.filtros.fechaHasta ?? '');
      this.granularidad.set(this.filtros.granularidad ?? 'daily');
    }
  }

  // ── Actions ──────────────────────────────────────────────
  aplicarPreset(preset: RangoPreset): void {
    this.desde.set(preset.desde);
    this.hasta.set(preset.hasta);
    this.presetActivo.set(preset.label);
    this._emitir();
  }

  onDesdeChange(val: string): void {
    this.desde.set(val);
    this.presetActivo.set('');
    this._emitir();
  }

  onHastaChange(val: string): void {
    this.hasta.set(val);
    this.presetActivo.set('');
    this._emitir();
  }

  onGranularidadChange(val: Granularidad): void {
    this.granularidad.set(val);
    this._emitir();
  }

  emitirExportar(formato: 'csv' | 'xlsx' | 'pdf'): void {
    this.exportar.emit({ formato });
  }

  // ── Private ──────────────────────────────────────────────
  private _emitir(): void {
    this.filtrosChange.emit({
      fechaDesde:   this.desde(),
      fechaHasta:   this.hasta(),
      granularidad: this.granularidad(),
    });
  }

  private _buildPresets(): RangoPreset[] {
    const hoy    = new Date();
    const fmt    = (d: Date) => d.toISOString().slice(0, 10);

    const hoyStr = fmt(hoy);

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const inicioMes    = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesAnt    = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    return [
      { label: 'Hoy',         desde: hoyStr,              hasta: hoyStr              },
      { label: 'Ayer',        desde: fmt(ayer),            hasta: fmt(ayer)           },
      { label: 'Esta semana', desde: fmt(inicioSemana),    hasta: hoyStr              },
      { label: 'Este mes',    desde: fmt(inicioMes),       hasta: hoyStr              },
      { label: 'Mes pasado',  desde: fmt(inicioMesAnt),    hasta: fmt(finMesAnt)      },
    ];
  }
}
