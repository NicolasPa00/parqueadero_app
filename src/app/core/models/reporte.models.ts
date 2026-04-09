/**
 * reporte.models.ts
 * Interfaces y tipos TypeScript para el módulo de reportes.
 */

// ─────────────────────────────────────────────
// Filtros comunes
// ─────────────────────────────────────────────

export type Granularidad = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type FormatoReporte = 'json' | 'csv' | 'xlsx' | 'pdf';
export type StatusReporte = 'ready' | 'queued' | 'running' | 'failed' | 'not_found';
export type EstadoFactura = 'A' | 'C' | 'X';
export type TipoReporte =
  | 'daily_revenue'
  | 'monthly_revenue'
  | 'transactions'
  | 'occupancy'
  | 'throughput'
  | 'stay_duration'
  | 'peak_hours'
  | 'vehicle_type_mix'
  | 'payment_methods'
  | 'anomalies'
  | 'plate_history';

export interface FiltrosReporte {
  idNegocio: number;
  fechaDesde: string;         // YYYY-MM-DD
  fechaHasta: string;         // YYYY-MM-DD
  granularidad?: Granularidad;
  idTipoVehiculo?: number | null;
  idUsuario?: number | null;
  estadoFactura?: EstadoFactura | null;
  placa?: string | null;
  page?: number;
  pageSize?: number;
  sort?: string;
  formato?: FormatoReporte;
}

// ─────────────────────────────────────────────
// Resumen KPIs
// ─────────────────────────────────────────────

export interface ResumenPeriodo {
  total_transacciones: number;
  total_ingresos: number;
  ticket_promedio: number;
  duracion_promedio_min: number;
}

// ─────────────────────────────────────────────
// Ingresos aggregados
// ─────────────────────────────────────────────

export interface PuntoSerie {
  periodo: string;
  num_transacciones: number;
  total_ingresos: number;
  ticket_promedio: number;
  duracion_promedio_min?: number;
  crecimiento_mom_pct?: number | null;
}

export interface IngresosAgregadosResponse {
  granularidad: Granularidad;
  serie: PuntoSerie[];
  totales: {
    total_periodo: number;
    transacciones_periodo: number;
    ticket_promedio: number;
  };
}

// ─────────────────────────────────────────────
// Transacciones
// ─────────────────────────────────────────────

export interface Transaccion {
  id_factura: number;
  numero_factura: string;
  placa: string;
  id_tipo_vehiculo: number;
  nombre_tipo_vehiculo: string;
  fecha_entrada_local: string;
  fecha_cierre_local: string;
  duracion_minutos: number;
  valor_total: number;
  estado: EstadoFactura;
  tipo_cobro: string;
  id_negocio: number;
  nombre_cajero: string;
}

export interface TransaccionesPaginadas {
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Transaccion[];
}

// ─────────────────────────────────────────────
// Ocupación
// ─────────────────────────────────────────────

export interface PuntoOcupacion {
  periodo: string;
  entradas: number;
  salidas: number;
  capacidad_total: number;
  pct_ocupacion?: number;
}

// ─────────────────────────────────────────────
// Horas pico
// ─────────────────────────────────────────────

export interface PuntoHoraPico {
  hora_local: number;
  total_entradas: number;
  promedio_entradas_por_dia: number;
  total_salidas: number;
  promedio_salidas_por_dia: number;
}

export interface HorasPicoResponse {
  horas: PuntoHoraPico[];
  top3HorasPico: number[];
}

// ─────────────────────────────────────────────
// Distribución por tipo de vehículo
// ─────────────────────────────────────────────

export interface DistribucionTipoVehiculo {
  id_tipo_vehiculo: number;
  nombre_tipo: string;
  cantidad: number;
  porcentaje: number;
  duracion_promedio_min: number;
  ingreso_promedio: number;
}

// ─────────────────────────────────────────────
// Reconciliación de caja
// ─────────────────────────────────────────────

export interface MovimientoCajaDetalle {
  id_movimiento: number;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  concepto: string;
  fecha_local: string;
}

export interface ReconciliacionCaja {
  id_caja: number;
  id_negocio: number;
  nombre_cajero: string;
  fecha_apertura_local: string;
  fecha_cierre_local: string | null;
  monto_apertura: number;
  monto_cierre: number | null;
  total_ingresos_caja: number;
  total_egresos_caja: number;
  diferencia: number;
  estado_caja: 'A' | 'C';
  movimientos: MovimientoCajaDetalle[];
}

// ─────────────────────────────────────────────
// Anomalías
// ─────────────────────────────────────────────

export interface Anomalia {
  tipo_evento: string;
  id_referencia: number;
  descripcion: string;
  detectado_en: string;
  id_negocio: number;
  usuario: string;
}

// ─────────────────────────────────────────────
// Generación de reportes
// ─────────────────────────────────────────────

export interface GenerarReporteRequest {
  tipo_reporte: TipoReporte;
  id_negocio: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  granularidad?: Granularidad;
  filtros?: Record<string, unknown>;
  formato?: FormatoReporte;
}

export interface GenerarReporteResponse {
  reporte_id: string;
  status: StatusReporte;
  estimated_ready_at?: string;
  rows?: number;
  generated_at?: string;
  resultado?: unknown[];
}

export interface EstadoReporteResponse {
  reporte_id: string;
  status: StatusReporte;
  download_url?: string;
  expires_at?: string;
  meta: {
    rows: number;
    generated_at: string | null;
    formato: FormatoReporte | null;
  };
}

// ─────────────────────────────────────────────
// Reportes programados
// ─────────────────────────────────────────────

export type CronPreset = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface ReporteProgramado {
  id_programacion: number;
  id_negocio: number;
  nombre: string;
  tipo_reporte: TipoReporte;
  cron_expression: string;
  formato: FormatoReporte;
  email_destinatarios: string[];
  filtros: Record<string, unknown>;
  retention_days: number;
  activo: boolean;
  fecha_creacion: string;
  ultimo_envio: string | null;
  proximo_envio: string | null;
}

export interface CrearProgramacionRequest {
  id_negocio: number;
  nombre: string;
  tipo_reporte: TipoReporte;
  cron_expression: string;
  formato: 'pdf' | 'csv' | 'xlsx';
  email_destinatarios: string[];
  filtros?: Record<string, unknown>;
  retention_days?: number;
}

// ─────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────

export interface ApiReporteResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─────────────────────────────────────────────
// Estado del store
// ─────────────────────────────────────────────

export type TabReporte = 'resumen' | 'transacciones' | 'ingresos' | 'ocupacion' | 'horas-pico' | 'tipos' | 'turno' | 'programados';

export interface ReporteStoreState {
  cargando: boolean;
  error: string | null;
  tabActiva: TabReporte;
  filtros: FiltrosReporte;
  resumen: ResumenPeriodo | null;
  ingresosAgregados: IngresosAgregadosResponse | null;
  transacciones: TransaccionesPaginadas | null;
  ocupacion: PuntoOcupacion[];
  horasPico: HorasPicoResponse | null;
  distribucionTipos: DistribucionTipoVehiculo[];
  programados: ReporteProgramado[];
}
