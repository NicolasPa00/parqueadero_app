// ── API Response ──
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

// ── Permiso de nivel ──
export interface NivelPermiso {
  id_nivel: number;
  descripcion: string;
  id_nivel_padre: number | null;
  id_tipo_nivel: number;   // 1 = módulo, 3 = página/acción
  url: string;
  icono: string;
}

// ── Auth ──
export interface UserRol {
  id_rol: number;
  descripcion: string;
}

export interface UserNegocio {
  id_negocio: number;
  nombre: string;
  tipo_negocio: string | null;
  paleta: { id_paleta: number; nombre: string; colores: unknown } | null;
  roles: UserRol[];
}

export interface UserProfile {
  id_usuario: number;
  nombre_completo: string;
  primer_nombre: string;
  primer_apellido: string;
  email: string;
}

export interface AccesoParqueadero {
  usuario: UserProfile;
  negocios: UserNegocio[];
  negocio: UserNegocio | null;
  roles: UserRol[];
  roles_globales: UserRol[];
  niveles: NivelPermiso[];
}

export type VerificarTokenResponse = ApiResponse<AccesoParqueadero>;

// ── Dashboard KPIs ──
export interface DashboardKpis {
  vehiculos_actuales: number;
  capacidad_total: number;
  ocupacion_porcentaje: number;
  ingresos_hoy: number;
  entradas_hoy: number;
  salidas_hoy: number;
}

export interface UltimoVehiculo {
  id_vehiculo: number;
  placa: string;
  tipo: string;
  fecha_entrada: string;
}

export interface ResumenDashboard {
  kpis: DashboardKpis;
  ultimos_vehiculos: UltimoVehiculo[];
}

export type DashboardResponse = ApiResponse<ResumenDashboard>;

// ── Tipo Vehículo ──
export interface TipoVehiculo {
  id_tipo_vehiculo: number;
  nombre: string;
  descripcion?: string;
  id_negocio: number;
  estado: string;
}

// ── Tarifa ──
export interface Tarifa {
  id_tarifa: number;
  id_tipo_vehiculo: number;
  id_negocio: number;
  tipo_cobro: 'HORA' | 'FRACCION' | 'DIA' | 'MES';
  valor: number;
  valor_adicional?: number | null;
  descripcion?: string;
  estado?: string;
  tipoVehiculo?: { nombre: string };
}

// ── Vehículo ──
export interface Vehiculo {
  id_vehiculo: number;
  placa: string;
  id_tipo_vehiculo: number;
  id_negocio: number;
  fecha_entrada: string;
  fecha_salida?: string;
  valor_cobrado?: number;
  observaciones?: string;
  estado: string;
  tipoVehiculo?: { nombre: string };
  tarifa?: { tipo_cobro: string; valor: number; valor_adicional?: number | null };
}

export interface VehiculosPaginados {
  vehiculos: Vehiculo[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Capacidad ──
export interface Capacidad {
  id_capacidad: number;
  id_negocio: number;
  id_tipo_vehiculo: number;
  espacios_total: number;
  tipoVehiculo?: { nombre: string };
}

// ── Factura ──
export interface Factura {
  id_factura:      number;
  id_negocio:      number;
  numero_factura:  string;
  id_vehiculo?:    number;
  placa?:          string;
  id_tipo_vehiculo?: number;
  id_tarifa?:      number;
  tipo_cobro?:     string;
  valor_unitario?: number;
  valor_total?:    number;
  estado:          string; // A=Abierta C=Cerrada X=Anulada
  fecha_entrada?:  string;
  fecha_cierre?:   string;
  fecha_creacion:  string;
}

// Extension of Vehiculo that includes factura info returned on entry/exit
export interface VehiculoConFactura extends Vehiculo {
  id_factura?:     number;
  numero_factura?: string;
}

// ── Abonado ──
export interface Abonado {
  id_abonado: number;
  nombre: string;
  documento?: string;
  telefono?: string;
  placa: string;
  id_tipo_vehiculo: number;
  id_negocio: number;
  fecha_inicio: string;
  fecha_fin: string;
  valor_mensualidad: number;
  tipoVehiculo?: { nombre: string };
}

// ── Caja ──
export interface Caja {
  id_caja: number;
  id_negocio: number;
  id_usuario: number;
  monto_apertura: number;
  monto_cierre?: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  estado: string;
  observaciones?: string;
  usuario?: { primer_nombre: string; primer_apellido: string };
}

export interface MovimientoCaja {
  id_movimiento: number;
  id_caja: number;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  concepto?: string;
  id_vehiculo?: number;
  fecha: string;
  usuario?: { primer_nombre: string; primer_apellido: string };
}

// ── Configuración ──
export interface ConfiguracionParqueadero {
  id_configuracion: number;
  id_negocio: number;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  horario_apertura?: string;
  horario_cierre?: string;
  logo_url?: string;
}

// ── Sidebar nav ──
export interface NavItem {
  id: number;
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
}
