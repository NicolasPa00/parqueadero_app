/**
 * reporte.service.ts
 * Servicio Angular para el módulo de reportes del parqueadero.
 * Consume los endpoints del backend.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  ApiReporteResponse,
  CrearProgramacionRequest,
  EstadoReporteResponse,
  FiltrosReporte,
  GenerarReporteRequest,
  GenerarReporteResponse,
  Granularidad,
  HorasPicoResponse,
  IngresosAgregadosResponse,
  ReporteProgramado,
  ResumenPeriodo,
  TransaccionesPaginadas,
  DistribucionTipoVehiculo,
  PuntoOcupacion,
  ReconciliacionCaja,
  Anomalia,
} from '../models/reporte.models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly api  = inject(API_BASE_URL);

  private get base(): string {
    return `${this.api}/reportes`;
  }

  // ─────────────────────────────────────────────
  // Helper: construye HttpParams desde FiltrosReporte parcial
  // ─────────────────────────────────────────────

  private toParams(filtros: Partial<FiltrosReporte>): HttpParams {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return params;
  }

  // ─────────────────────────────────────────────
  // Helper: normaliza HttpErrorResponse → Error con mensaje del servidor
  // ─────────────────────────────────────────────

  private handleError(context: string) {
    return (err: HttpErrorResponse): Observable<never> => {
      const serverMsg: string =
        (err.error as any)?.message ||
        err.statusText ||
        'Error desconocido';
      const detail   = (err.error as any)?.errors;
      const fullMsg  = detail?.length
        ? `${serverMsg}: ${detail.map((e: any) => e.msg || e.message).join('; ')}`
        : serverMsg;
      const wrapped  = Object.assign(new Error(fullMsg), {
        status:  err.status,
        context,
      });
      return throwError(() => wrapped);
    };
  }

  // ─────────────────────────────────────────────
  // KPI Cards — resumen del período
  // ─────────────────────────────────────────────

  getResumenPeriodo(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Observable<ApiReporteResponse<ResumenPeriodo>> {
    return this.http.get<ApiReporteResponse<ResumenPeriodo>>(`${this.base}/resumen`, {
      params: this.toParams({ idNegocio, fechaDesde, fechaHasta }),
    }).pipe(catchError(this.handleError('Cargando resumen del período')));
  }

  // ─────────────────────────────────────────────
  // Serie temporal de ingresos
  // ─────────────────────────────────────────────

  getIngresosAgregados(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
    granularidad: Granularidad = 'daily',
  ): Observable<ApiReporteResponse<IngresosAgregadosResponse>> {
    return this.http.get<ApiReporteResponse<IngresosAgregadosResponse>>(
      `${this.base}/ingresos/agregado`,
      { params: this.toParams({ idNegocio, fechaDesde, fechaHasta, granularidad }) },
    ).pipe(catchError(this.handleError('Cargando ingresos agregados')));
  }

  // ─────────────────────────────────────────────
  // Transacciones paginadas
  // ─────────────────────────────────────────────

  getTransacciones(
    filtros: Partial<FiltrosReporte>,
  ): Observable<ApiReporteResponse<TransaccionesPaginadas>> {
    return this.http.get<ApiReporteResponse<TransaccionesPaginadas>>(
      `${this.base}/transacciones`,
      { params: this.toParams(filtros) },
    ).pipe(catchError(this.handleError('Cargando transacciones')));
  }

  // ─────────────────────────────────────────────
  // Ocupación
  // ─────────────────────────────────────────────

  getOcupacion(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
    granularidad: Granularidad = 'daily',
  ): Observable<ApiReporteResponse<{ serie: PuntoOcupacion[] }>> {
    return this.http.get<ApiReporteResponse<{ serie: PuntoOcupacion[] }>>(
      `${this.base}/ocupacion`,
      { params: this.toParams({ idNegocio, fechaDesde, fechaHasta, granularidad }) },
    ).pipe(catchError(this.handleError('Cargando datos de ocupación')));
  }

  // ─────────────────────────────────────────────
  // Horas pico
  // ─────────────────────────────────────────────

  getHorasPico(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Observable<ApiReporteResponse<HorasPicoResponse>> {
    return this.http.get<ApiReporteResponse<HorasPicoResponse>>(
      `${this.base}/horas-pico`,
      { params: this.toParams({ idNegocio, fechaDesde, fechaHasta }) },
    ).pipe(catchError(this.handleError('Cargando horas pico')));
  }

  // ─────────────────────────────────────────────
  // Distribución por tipo de vehículo
  // ─────────────────────────────────────────────

  getDistribucionTipos(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Observable<ApiReporteResponse<DistribucionTipoVehiculo[]>> {
    return this.http.get<ApiReporteResponse<DistribucionTipoVehiculo[]>>(
      `${this.base}/tipos-vehiculo-mix`,
      { params: this.toParams({ idNegocio, fechaDesde, fechaHasta }) },
    ).pipe(catchError(this.handleError('Cargando distribución de vehículos')));
  }

  // ─────────────────────────────────────────────
  // Reconciliación de caja / turno
  // ─────────────────────────────────────────────

  getReconciliacionCaja(
    idCaja: number,
    idNegocio: number,
  ): Observable<ApiReporteResponse<ReconciliacionCaja>> {
    return this.http.get<ApiReporteResponse<ReconciliacionCaja>>(
      `${this.base}/turno/${idCaja}`,
      { params: { id_negocio: String(idNegocio) } },
    );
  }

  // ─────────────────────────────────────────────
  // Anomalías
  // ─────────────────────────────────────────────

  getAnomalias(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
  ): Observable<ApiReporteResponse<Anomalia[]>> {
    return this.http.get<ApiReporteResponse<Anomalia[]>>(
      `${this.base}/anomalias`,
      { params: this.toParams({ idNegocio, fechaDesde, fechaHasta }) },
    );
  }

  // ─────────────────────────────────────────────
  // Generación de reportes (síncrono / asíncrono)
  // ─────────────────────────────────────────────

  generarReporte(
    body: GenerarReporteRequest,
  ): Observable<ApiReporteResponse<GenerarReporteResponse>> {
    return this.http.post<ApiReporteResponse<GenerarReporteResponse>>(
      `${this.base}/generar`,
      body,
    ).pipe(catchError(this.handleError('Generando reporte')));
  }

  getEstadoReporte(
    reporteId: string,
  ): Observable<ApiReporteResponse<EstadoReporteResponse>> {
    return this.http.get<ApiReporteResponse<EstadoReporteResponse>>(
      `${this.base}/${reporteId}`,
    ).pipe(catchError(this.handleError('Consultando estado del reporte')));
  }

  // ─────────────────────────────────────────────
  // Descarga directa (abre ventana de descarga)
  // ─────────────────────────────────────────────

  descargarDirecto(
    idNegocio: number,
    fechaDesde: string,
    fechaHasta: string,
    tipoReporte: string,
    formato: 'csv' | 'xlsx' | 'pdf',
  ): Observable<Blob> {
    return this.http.post(
      `${this.base}/generar`,
      { tipo_reporte: tipoReporte, id_negocio: idNegocio, fecha_desde: fechaDesde, fecha_hasta: fechaHasta, formato },
      { responseType: 'blob' },
    );
  }

  // ─────────────────────────────────────────────
  // Reportes programados
  // ─────────────────────────────────────────────

  getProgramados(
    idNegocio: number,
  ): Observable<ApiReporteResponse<ReporteProgramado[]>> {
    return this.http.get<ApiReporteResponse<ReporteProgramado[]>>(
      `${this.base}/programados`,
      { params: { id_negocio: String(idNegocio) } },
    ).pipe(catchError(this.handleError('Cargando reportes programados')));
  }

  crearProgramacion(
    body: CrearProgramacionRequest,
  ): Observable<ApiReporteResponse<{ schedule_id: number }>> {
    return this.http.post<ApiReporteResponse<{ schedule_id: number }>>(
      `${this.base}/programados`,
      body,
    ).pipe(catchError(this.handleError('Creando programación')));
  }

  eliminarProgramacion(
    scheduleId: number,
    idNegocio: number,
  ): Observable<ApiReporteResponse<null>> {
    return this.http.delete<ApiReporteResponse<null>>(
      `${this.base}/programados/${scheduleId}`,
      { params: { id_negocio: String(idNegocio) } },
    ).pipe(catchError(this.handleError('Eliminando programación')));
  }
}
