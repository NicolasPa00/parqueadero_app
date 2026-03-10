import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import {
  ApiResponse,
  DashboardResponse,
  TipoVehiculo,
  Tarifa,
  Vehiculo,
  VehiculosPaginados,
  VehiculoConFactura,
  Factura,
  Capacidad,
  Abonado,
  Caja,
  MovimientoCaja,
  ConfiguracionParqueadero,
} from '../../core/models/parqueadero.models';

@Injectable({ providedIn: 'root' })
export class ParqueaderoService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_BASE_URL);

  // ── Dashboard ──
  getDashboard(idNegocio: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.api}/dashboard/resumen`, {
      params: { id_negocio: idNegocio },
    });
  }

  // ── Vehículos ──
  registrarEntrada(data: {
    placa: string;
    id_tipo_vehiculo: number;
    id_negocio: number;
    id_tarifa?: number;
    observaciones?: string;
  }): Observable<ApiResponse<VehiculoConFactura>> {
    return this.http.post<ApiResponse<VehiculoConFactura>>(`${this.api}/vehiculos/entrada`, data);
  }

  registrarSalida(idVehiculo: number, idNegocio: number, valorCobrado: number): Observable<ApiResponse<VehiculoConFactura>> {
    return this.http.put<ApiResponse<VehiculoConFactura>>(`${this.api}/vehiculos/${idVehiculo}/salida`, {
      id_negocio: idNegocio,
      valor_cobrado: valorCobrado,
    });
  }

  /** Busca un vehículo activo por placa (para escaner de barras) */
  buscarVehiculoActivo(placa: string, idNegocio: number): Observable<ApiResponse<Vehiculo>> {
    return this.http.get<ApiResponse<Vehiculo>>(`${this.api}/vehiculos/buscar`, {
      params: { placa, id_negocio: idNegocio },
    });
  }

  /** Costo estimado en tiempo real para un vehículo dentro del parqueadero */
  calcularCosto(idVehiculo: number, idNegocio: number): Observable<ApiResponse<{ costo: number; tarifa: { tipo_cobro: string; valor: number } | null }>> {
    return this.http.get<ApiResponse<any>>(`${this.api}/vehiculos/${idVehiculo}/calcular-costo`, {
      params: { id_negocio: idNegocio },
    });
  }

  getFactura(idFactura: number, idNegocio: number): Observable<ApiResponse<Factura>> {
    return this.http.get<ApiResponse<Factura>>(`${this.api}/facturas/${idFactura}`, {
      params: { id_negocio: idNegocio },
    });
  }

  /** Devuelve la URL del recibo HTML (para abrir en nueva pestaña e imprimir) */
  facturaHtmlUrl(idFactura: number, idNegocio: number, conSalida = false): string {
    return `${this.api}/facturas/${idFactura}/html?id_negocio=${idNegocio}&con_salida=${conSalida}`;
  }

  getVehiculosActuales(idNegocio: number, page = 1, placa?: string): Observable<ApiResponse<VehiculosPaginados>> {
    let params = new HttpParams().set('id_negocio', idNegocio).set('page', page);
    if (placa) params = params.set('placa', placa);
    return this.http.get<ApiResponse<VehiculosPaginados>>(`${this.api}/vehiculos/actuales`, { params });
  }

  getHistorialVehiculos(
    idNegocio: number, page = 1, filters?: { placa?: string; desde?: string; hasta?: string }
  ): Observable<ApiResponse<VehiculosPaginados>> {
    let params = new HttpParams().set('id_negocio', idNegocio).set('page', page);
    if (filters?.placa) params = params.set('placa', filters.placa);
    if (filters?.desde) params = params.set('desde', filters.desde);
    if (filters?.hasta) params = params.set('hasta', filters.hasta);
    return this.http.get<ApiResponse<VehiculosPaginados>>(`${this.api}/vehiculos/historial`, { params });
  }

  // ── Tipos de vehículo ──
  getTiposVehiculo(idNegocio: number): Observable<ApiResponse<TipoVehiculo[]>> {
    return this.http.get<ApiResponse<TipoVehiculo[]>>(`${this.api}/tipos-vehiculo`, {
      params: { id_negocio: idNegocio },
    });
  }

  createTipoVehiculo(data: Partial<TipoVehiculo>): Observable<ApiResponse<TipoVehiculo>> {
    return this.http.post<ApiResponse<TipoVehiculo>>(`${this.api}/tipos-vehiculo`, data);
  }

  updateTipoVehiculo(id: number, data: Partial<TipoVehiculo>): Observable<ApiResponse<TipoVehiculo>> {
    return this.http.put<ApiResponse<TipoVehiculo>>(`${this.api}/tipos-vehiculo/${id}`, data);
  }

  // ── Tarifas ──
  getTarifas(idNegocio: number): Observable<ApiResponse<Tarifa[]>> {
    return this.http.get<ApiResponse<Tarifa[]>>(`${this.api}/tarifas`, {
      params: { id_negocio: idNegocio },
    });
  }

  createTarifa(data: Partial<Tarifa>): Observable<ApiResponse<Tarifa>> {
    return this.http.post<ApiResponse<Tarifa>>(`${this.api}/tarifas`, data);
  }

  updateTarifa(id: number, data: Partial<Tarifa>): Observable<ApiResponse<Tarifa>> {
    return this.http.put<ApiResponse<Tarifa>>(`${this.api}/tarifas/${id}`, data);
  }

  deleteTarifa(id: number, idNegocio: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.api}/tarifas/${id}`, {
      params: { id_negocio: idNegocio },
    });
  }

  // ── Capacidad ──
  getCapacidad(idNegocio: number): Observable<ApiResponse<Capacidad[]>> {
    return this.http.get<ApiResponse<Capacidad[]>>(`${this.api}/capacidad`, {
      params: { id_negocio: idNegocio },
    });
  }

  upsertCapacidad(data: { id_negocio: number; id_tipo_vehiculo: number; espacios_total: number }): Observable<ApiResponse<Capacidad>> {
    return this.http.put<ApiResponse<Capacidad>>(`${this.api}/capacidad`, data);
  }

  // ── Configuración ──
  getConfiguracion(idNegocio: number): Observable<ApiResponse<ConfiguracionParqueadero>> {
    return this.http.get<ApiResponse<ConfiguracionParqueadero>>(`${this.api}/configuracion`, {
      params: { id_negocio: idNegocio },
    });
  }

  upsertConfiguracion(data: Partial<ConfiguracionParqueadero> & { id_negocio: number }): Observable<ApiResponse<ConfiguracionParqueadero>> {
    return this.http.put<ApiResponse<ConfiguracionParqueadero>>(`${this.api}/configuracion`, data);
  }

  // ── Abonados ──
  getAbonados(idNegocio: number): Observable<ApiResponse<Abonado[]>> {
    return this.http.get<ApiResponse<Abonado[]>>(`${this.api}/abonados`, {
      params: { id_negocio: idNegocio },
    });
  }

  createAbonado(data: Partial<Abonado>): Observable<ApiResponse<Abonado>> {
    return this.http.post<ApiResponse<Abonado>>(`${this.api}/abonados`, data);
  }

  updateAbonado(id: number, data: Partial<Abonado>): Observable<ApiResponse<Abonado>> {
    return this.http.put<ApiResponse<Abonado>>(`${this.api}/abonados/${id}`, data);
  }

  // ── Caja ──
  getCajaAbierta(idNegocio: number): Observable<ApiResponse<Caja | null>> {
    return this.http.get<ApiResponse<Caja | null>>(`${this.api}/caja/abierta`, {
      params: { id_negocio: idNegocio },
    });
  }

  abrirCaja(idNegocio: number, montoApertura: number): Observable<ApiResponse<Caja>> {
    return this.http.post<ApiResponse<Caja>>(`${this.api}/caja/abrir`, {
      id_negocio: idNegocio,
      monto_apertura: montoApertura,
    });
  }

  cerrarCaja(idCaja: number, idNegocio: number, observaciones?: string): Observable<ApiResponse<Caja>> {
    return this.http.put<ApiResponse<Caja>>(`${this.api}/caja/${idCaja}/cerrar`, {
      id_negocio: idNegocio,
      observaciones,
    });
  }

  getMovimientosCaja(idCaja: number): Observable<ApiResponse<MovimientoCaja[]>> {
    return this.http.get<ApiResponse<MovimientoCaja[]>>(`${this.api}/caja/${idCaja}/movimientos`);
  }

  registrarMovimientoCaja(data: {
    id_caja: number;
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    concepto?: string;
    id_vehiculo?: number;
  }): Observable<ApiResponse<MovimientoCaja>> {
    return this.http.post<ApiResponse<MovimientoCaja>>(`${this.api}/caja/movimientos`, data);
  }
}
