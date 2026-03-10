import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';
import { VehiculoConFactura } from '../models/parqueadero.models';

const TZ = 'America/Bogota';

function fmtFecha(iso: string | undefined | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

function fmtMoneda(valor: number | undefined | null): string {
  if (valor == null) return '—';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
}

@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly auth = inject(AuthService);

  private get negocioNombre(): string {
    return this.auth.negocio()?.nombre ?? 'Parqueadero';
  }

  imprimirEntrada(vehiculo: VehiculoConFactura): void {
    this.abrir(this.buildHtml(vehiculo, false));
  }

  imprimirSalida(vehiculo: VehiculoConFactura): void {
    this.abrir(this.buildHtml(vehiculo, true));
  }

  private buildHtml(v: VehiculoConFactura, esSalida: boolean): string {
    const tipoCobro = v.tarifa?.tipo_cobro ?? '—';
    const valorUnit  = v.tarifa?.valor;
    const tipoVeh   = v.tipoVehiculo?.nombre ?? '—';
    const placa     = v.placa ?? '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esSalida ? 'Recibo de salida' : 'Recibo de entrada'}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #111; padding: 16px; max-width: 320px; margin: 0 auto; }
  .center { text-align: center; }
  .negocio { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
  .subtitulo { font-size: 11px; color: #555; margin-bottom: 10px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  .fila { display: flex; justify-content: space-between; margin: 3px 0; }
  .lbl { color: #555; }
  .placa { font-size: 22px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 8px 0; }
  .total { font-size: 16px; font-weight: bold; text-align: center; margin: 8px 0; }
  .barcode-wrap { text-align: center; margin: 8px 0; }
  .barcode-wrap svg { max-width: 100%; }
  .pie { font-size: 10px; color: #888; text-align: center; margin-top: 12px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="center">
    <div class="negocio">${this.negocioNombre}</div>
    <div class="subtitulo">${esSalida ? 'RECIBO DE SALIDA' : 'RECIBO DE ENTRADA'}</div>
  </div>
  <hr>
  ${v.numero_factura ? `<div class="fila"><span class="lbl">Factura</span><span>${v.numero_factura}</span></div>` : ''}
  <div class="placa">${placa}</div>
  <div class="barcode-wrap"><svg id="barcode"></svg></div>
  <div class="fila"><span class="lbl">Tipo vehículo</span><span>${tipoVeh}</span></div>
  <div class="fila"><span class="lbl">Tarifa</span><span>${tipoCobro}${valorUnit != null ? ' · ' + fmtMoneda(valorUnit) : ''}</span></div>
  <hr>
  <div class="fila"><span class="lbl">Entrada</span><span>${fmtFecha(v.fecha_entrada)}</span></div>
  ${esSalida ? `<div class="fila"><span class="lbl">Salida</span><span>${fmtFecha(v.fecha_salida ?? new Date().toISOString())}</span></div>` : ''}
  ${esSalida ? `<hr><div class="total">TOTAL: ${fmtMoneda(v.valor_cobrado)}</div>` : ''}
  <hr>
  <div class="pie">Gracias por su visita</div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    JsBarcode('#barcode', '${placa}', {
      format: 'CODE128',
      width: 1.8,
      height: 45,
      displayValue: true,
      fontSize: 11,
      margin: 4
    });
    ${esSalida ? "window.focus(); window.print(); window.addEventListener('afterprint', function(){ window.close(); });" : ''}
  });
<\/script>
</body>
</html>`;
  }

  private abrir(html: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank', 'width=400,height=600,toolbar=0,menubar=0');
    if (!win) {
      // Si el popup fue bloqueado, liberar el blob URL
      URL.revokeObjectURL(url);
    } else {
      // Liberar el blob URL después de que la ventana lo cargue
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  }
}
