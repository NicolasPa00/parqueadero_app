import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/data-access/auth.service';
import { VehiculoConFactura } from '../models/parqueadero.models';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly auth   = inject(AuthService);
  private readonly http   = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private get idNegocio(): number {
    return this.auth.negocio()?.id_negocio ?? 0;
  }

  /**
   * Envía el recibo al backend para impresión silenciosa.
   * El backend genera el PDF y lo manda directamente a la impresora
   * configurada para este negocio — sin ningún diálogo.
   */
  imprimirEntrada(vehiculo: VehiculoConFactura): void {
    this.enviarAlBackend(vehiculo, false);
  }

  imprimirSalida(vehiculo: VehiculoConFactura): void {
    this.enviarAlBackend(vehiculo, true);
  }

  private enviarAlBackend(v: VehiculoConFactura, esSalida: boolean): void {
    this.http.post(`${this.apiUrl}/imprimir/recibo`, {
      vehiculoData: v,
      esSalida,
      id_negocio: this.idNegocio,
    }).subscribe({
      error: (err) => {
        console.warn('Impresión silenciosa no disponible, usando diálogo del navegador:', err);
        // Fallback: impresión con iframe si el backend falla
        this.imprimirFallback(v, esSalida);
      },
    });
  }

  // ─── Fallback: impresión por navegador si el backend no responde ───────────

  private imprimirFallback(v: VehiculoConFactura, esSalida: boolean): void {
    const html = this.buildHtml(v, esSalida);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'display:none;position:absolute;';
    document.body.appendChild(iframe);

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 500);
      }, 300);
    };
    iframe.onerror = () => { document.body.removeChild(iframe); URL.revokeObjectURL(url); };
    iframe.src = url;
  }

  private buildHtml(v: VehiculoConFactura, esSalida: boolean): string {
    const esc = (s: string) => String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const fmtMoneda = (val: number | null | undefined) =>
      val == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
    const fmtFecha = (iso: string | undefined | null) => {
      if (!iso) return '—';
      return new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
      }).format(new Date(iso));
    };

    const titulo   = esSalida ? 'RECIBO DE SALIDA' : 'RECIBO DE ENTRADA';
    const tipoVeh  = v.tipoVehiculo?.nombre ?? '—';
    const placa    = v.placa ?? '';
    const negocio  = this.auth.negocio()?.nombre ?? 'Parqueadero';

    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${titulo}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Courier New',monospace;font-size:14px;color:#111;padding:18px;max-width:400px;margin:0 auto}
.c{text-align:center}.nb{font-size:22px;font-weight:bold}.su{font-size:11px;letter-spacing:3px;color:#555}
hr{border:none;border-top:1px dashed #aaa;margin:8px 0}.hs{border-top:2px solid #222}
.pl{font-size:36px;font-weight:bold;letter-spacing:5px;border:2px solid #222;padding:5px 12px;display:inline-block;border-radius:5px}
.bw{text-align:center;margin:8px 0}.bw svg{max-width:100%}
.r{display:flex;justify-content:space-between;margin:5px 0;font-size:13px}
.lbl{color:#666}.val{font-weight:bold;text-align:right}
.bg{background:#f0f0f0;border:1px solid #ccc;border-radius:4px;padding:2px 9px;font-size:13px;font-weight:bold}
.tw{text-align:center;margin:10px 0}.tl{font-size:11px;color:#666;letter-spacing:2px}.tv{font-size:28px;font-weight:bold}
.pie{font-size:10px;color:#999;text-align:center;margin-top:12px}
@media print{body{padding:0}@page{size:80mm auto;margin:6mm}}
</style></head><body>
<div class="c"><div class="nb">${esc(negocio)}</div><div class="su">${titulo}</div></div>
<hr class="hs">
${v.numero_factura ? `<div style="font-size:11px;color:#666;text-align:right">Factura: ${esc(v.numero_factura)}</div>` : ''}
<div class="c" style="margin:8px 0"><span class="pl">${esc(placa)}</span></div>
<div class="bw"><svg id="bc" data-val="${esc(placa)}"></svg></div>
<hr>
<div class="r"><span class="lbl">Tipo de vehículo</span><span class="bg">${esc(tipoVeh)}</span></div>
<div class="r"><span class="lbl">Tarifa</span><span class="val">${esc(v.tarifa?.tipo_cobro ?? '—')}${v.tarifa?.valor != null ? ' · ' + fmtMoneda(v.tarifa.valor) : ''}</span></div>
${v.tarifa?.valor_adicional != null ? `<div class="r"><span class="lbl">Hora adicional</span><span class="val">${fmtMoneda(v.tarifa.valor_adicional)}</span></div>` : ''}
<hr>
<div class="r"><span class="lbl">Entrada</span><span class="val">${fmtFecha(v.fecha_entrada)}</span></div>
${esSalida ? `<div class="r"><span class="lbl">Salida</span><span class="val">${fmtFecha(v.fecha_salida ?? new Date().toISOString())}</span></div>` : ''}
${esSalida ? `<hr class="hs"><div class="tw"><div class="tl">TOTAL A PAGAR</div><div class="tv">${fmtMoneda(v.valor_cobrado)}</div></div>` : ''}
${v.observaciones?.trim() ? `<hr><div style="font-size:11px;color:#555;font-style:italic">Obs: ${esc(v.observaciones.trim())}</div>` : ''}
<hr><div class="pie">¡Gracias por su visita!</div>
<script>document.addEventListener('DOMContentLoaded',function(){
  var p=document.getElementById('bc').getAttribute('data-val');
  JsBarcode('#bc',p,{format:'CODE128',width:2,height:55,displayValue:true,fontSize:12,margin:4});
});<\/script></body></html>`;
  }
}

