/**
 * reporte.store.ts
 * Signal Store para el módulo de reportes.
 * Centraliza todo el estado reactivo de la página de reportes.
 */

import { computed, signal, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { ReporteService } from '../../core/data-access/reporte.service';
import { AuthService }    from '../../auth/data-access/auth.service';
import {
  FiltrosReporte,
  IngresosAgregadosResponse,
  TransaccionesPaginadas,
  PuntoOcupacion,
  HorasPicoResponse,
  DistribucionTipoVehiculo,
  ResumenPeriodo,
  ReporteProgramado,
  TabReporte,
  TipoReporte,
  CrearProgramacionRequest,
  GenerarReporteRequest,
} from '../../core/models/reporte.models';

// ─────────────────────────────────────────────
// Filtros por defecto (último mes)
// ─────────────────────────────────────────────

function getFechaDesdefault(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getFechaHastaDefault(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// Store class (patrón Signal Store sin @ngrx/signals)
// ─────────────────────────────────────────────

export class ReporteStore {
  private readonly reporteService = inject(ReporteService);
  private readonly authService    = inject(AuthService);

  // ── Signals de estado ──
  readonly cargando           = signal(false);
  readonly error              = signal<string | null>(null);
  readonly exportError        = signal<string | null>(null);
  readonly tabActiva          = signal<TabReporte>('resumen');
  readonly resumen            = signal<ResumenPeriodo | null>(null);
  readonly ingresosAgregados  = signal<IngresosAgregadosResponse | null>(null);
  readonly transacciones      = signal<TransaccionesPaginadas | null>(null);
  readonly ocupacion          = signal<PuntoOcupacion[]>([]);
  readonly horasPico          = signal<HorasPicoResponse | null>(null);
  readonly distribucionTipos  = signal<DistribucionTipoVehiculo[]>([]);
  readonly programados        = signal<ReporteProgramado[]>([]);
  readonly cargandoExport     = signal(false);

  // ── Filtros ──
  readonly filtros = signal<FiltrosReporte>({
    idNegocio:    0,
    fechaDesde:   getFechaDesdefault(),
    fechaHasta:   getFechaHastaDefault(),
    granularidad: 'daily',
    page:         1,
    pageSize:     50,
    sort:         'fecha_cierre:DESC',
  });

  // ── Computados ──
  readonly idNegocio = computed(() => {
    const negocio = this.authService.negocio?.();
    return negocio?.id_negocio ?? 0;
  });

  readonly totalPaginas = computed(() => {
    const tx = this.transacciones();
    return tx ? tx.pages : 0;
  });

  // ─────────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────────

  inicializar(): void {
    const idNegocio = this.idNegocio();
    if (!idNegocio) return;
    this.filtros.update(f => ({ ...f, idNegocio }));
    this.cargarResumen();
    this.cargarIngresosAgregados();
  }

  actualizarFiltros(parcial: Partial<FiltrosReporte>): void {
    this.filtros.update(f => ({ ...f, ...parcial, page: 1 }));
  }

  cambiarTab(tab: TabReporte): void {
    this.tabActiva.set(tab);
    this.cargarDatosPorTab(tab);
  }

  cargarDatosPorTab(tab: TabReporte): void {
    switch (tab) {
      case 'resumen':      this.cargarResumen();           break;
      case 'ingresos':     this.cargarIngresosAgregados(); break;
      case 'transacciones': this.cargarTransacciones();    break;
      case 'ocupacion':    this.cargarOcupacion();         break;
      case 'horas-pico':   this.cargarHorasPico();         break;
      case 'tipos':        this.cargarDistribucionTipos(); break;
      case 'programados':  this.cargarProgramados();       break;
    }
  }

  // ── Loaders ──

  cargarResumen(): void {
    const f = this.filtros();
    if (!f.idNegocio) return;
    this.cargando.set(true);
    this.reporteService.getResumenPeriodo(f.idNegocio, f.fechaDesde, f.fechaHasta)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next:  res => { if (res.success) this.resumen.set(res.data); },
        error: err => this.error.set(this.extractMsg(err, 'Error al cargar el resumen')),
      });
  }

  cargarIngresosAgregados(): void {
    const f = this.filtros();
    if (!f.idNegocio) return;
    this.cargando.set(true);
    this.reporteService.getIngresosAgregados(f.idNegocio, f.fechaDesde, f.fechaHasta, f.granularidad)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next:  res => { if (res.success) this.ingresosAgregados.set(res.data); },
        error: err => this.error.set(this.extractMsg(err, 'Error al cargar ingresos')),
      });
  }

  cargarTransacciones(): void {
    const f = this.filtros();
    if (!f.idNegocio) return;
    this.cargando.set(true);
    this.reporteService.getTransacciones(f)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next:  res => { if (res.success) this.transacciones.set(res.data); },
        error: err => this.error.set(this.extractMsg(err, 'Error al cargar transacciones')),
      });
  }

  cambiarPagina(page: number): void {
    this.filtros.update(f => ({ ...f, page }));
    this.cargarTransacciones();
  }

  cargarOcupacion(): void {
    const f = this.filtros();
    if (!f.idNegocio) return;
    this.cargando.set(true);
    this.reporteService.getOcupacion(f.idNegocio, f.fechaDesde, f.fechaHasta, f.granularidad)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next:  res => { if (res.success) this.ocupacion.set(res.data.serie); },
        error: err => this.error.set(this.extractMsg(err, 'Error al cargar ocupación')),
      });
  }

  cargarHorasPico(): void {
    const f = this.filtros();
    if (!f.idNegocio) return;
    this.cargando.set(true);
    this.reporteService.getHorasPico(f.idNegocio, f.fechaDesde, f.fechaHasta)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next:  res => { if (res.success) this.horasPico.set(res.data); },
        error: err => this.error.set(this.extractMsg(err, 'Error al cargar horas pico')),
      });
  }

  cargarDistribucionTipos(): void {
    const f = this.filtros();
    if (!f.idNegocio) return;
    this.cargando.set(true);
    this.reporteService.getDistribucionTipos(f.idNegocio, f.fechaDesde, f.fechaHasta)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next:  res => { if (res.success) this.distribucionTipos.set(res.data); },
        error: err => this.error.set(this.extractMsg(err, 'Error al cargar distribución de vehículos')),
      });
  }

  cargarProgramados(): void {
    const idNegocio = this.idNegocio();
    if (!idNegocio) return;
    this.reporteService.getProgramados(idNegocio).subscribe({
      next:  res => { if (res.success) this.programados.set(res.data); },
      error: err => this.error.set(this.extractMsg(err, 'Error al cargar reportes programados')),
    });
  }

  // ── Exportación ──

  exportar(tipo: TipoReporte, formato: 'csv' | 'xlsx' | 'pdf'): void {
    const f   = this.filtros();
    const req: GenerarReporteRequest = {
      tipo_reporte: tipo,
      id_negocio:   f.idNegocio,
      fecha_desde:  f.fechaDesde,
      fecha_hasta:  f.fechaHasta,
      granularidad: f.granularidad,
      formato,
    };

    this.exportError.set(null);
    this.cargandoExport.set(true);
    this.reporteService.generarReporte(req)
      .pipe(finalize(() => this.cargandoExport.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            if (res.data.status === 'ready') {
              this.reporteService.getEstadoReporte(res.data.reporte_id).subscribe({
                next: estado => {
                  if (estado.success && estado.data.download_url) {
                    window.open(estado.data.download_url, '_blank');
                  } else {
                    this.exportError.set('El reporte fue generado, pero no se obtuvo una URL de descarga válida.');
                  }
                },
                error: err => this.exportError.set(this.extractMsg(err, 'Error al obtener el archivo generado')),
              });
            } else if (res.data.status === 'queued') {
              this.exportError.set(`El reporte está siendo generado en segundo plano. ID: ${res.data.reporte_id}`);
            }
          } else {
            this.exportError.set('El servidor indicó fallo al generar el reporte.');
          }
        },
        error: err => this.exportError.set(this.extractMsg(err, 'Error al exportar el reporte')),
      });
  }

  // ── Programaciones ──

  crearProgramacion(data: CrearProgramacionRequest): void {
    this.reporteService.crearProgramacion(data).subscribe({
      next: (res) => {
        if (res.success) this.cargarProgramados();
      },
      error: err => this.error.set(this.extractMsg(err, 'Error al crear programación')),
    });
  }

  eliminarProgramacion(scheduleId: number): void {
    const idNegocio = this.idNegocio();
    this.reporteService.eliminarProgramacion(scheduleId, idNegocio).subscribe({
      next: (res) => {
        if (res.success) {
          this.programados.update(lista => lista.filter(p => p.id_programacion !== scheduleId));
        }
      },
      error: err => this.error.set(this.extractMsg(err, 'Error al eliminar programación')),
    });
  }

  limpiarError(): void {
    this.error.set(null);
  }

  limpiarExportError(): void {
    this.exportError.set(null);
  }

  // ─────────────────────────────────────────────
  // Helper: extrae mensaje de error desde Error normalizado por el servicio
  // ─────────────────────────────────────────────

  private extractMsg(err: any, fallback: string): string {
    const msg: string | undefined = err?.message;
    return msg ? msg : fallback;
  }
}
