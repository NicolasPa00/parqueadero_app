import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Car,
  Bike,
  Truck,
  Bus,
  TriangleAlert,
  ScanLine,
  Camera,
} from 'lucide-angular';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { AuthService } from '../../auth/data-access/auth.service';
import { PrintService } from '../../core/services/print.service';
import { Vehiculo, VehiculoConFactura, TipoVehiculo, Tarifa } from '../../core/models/parqueadero.models';

type Vista = 'actuales' | 'historial';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './vehiculos.component.html',
  styleUrl: './vehiculos.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Car, Bike, Truck, Bus, TriangleAlert, ScanLine, Camera }),
    },
  ],
})
export class VehiculosComponent implements OnInit, OnDestroy {
  private readonly svc  = inject(ParqueaderoService);
  private readonly auth = inject(AuthService);
  private readonly print = inject(PrintService);

  // ── Barcode scanner (keyboard-wedge) ──
  private _scanBuffer = '';
  private _scanLastKey = 0;
  private _scanTimer: ReturnType<typeof setTimeout> | null = null;
  readonly SCAN_DEBOUNCE = 80;

  scanInput   = signal('');
  scanLoading = signal(false);
  scanError   = signal('');

  // ── Cámara QR scanner ──
  scanningCamara = signal(false);
  soportaCamara = signal(false);

  @ViewChild('scanInputRef') scanInputRef?: ElementRef<HTMLInputElement>;

  @HostListener('document:keydown', ['$event'])
  onGlobalKey(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (this.showEntrada() || this.showSalida()) return;

    const now = Date.now();
    if (e.key === 'Enter') {
      if (this._scanBuffer.length >= 3) {
        this.procesarScan(this._scanBuffer.toUpperCase());
      }
      this._scanBuffer = '';
      return;
    }
    if (e.key.length === 1) {
      if (now - this._scanLastKey > this.SCAN_DEBOUNCE && this._scanBuffer.length > 0) {
        this._scanBuffer = '';
      }
      this._scanBuffer += e.key;
      this._scanLastKey = now;
    }
  }

  // ── State ──
  vista = signal<Vista>('actuales');
  loading = signal(false);
  vehiculos = signal<Vehiculo[]>([]);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  tiposVehiculo = signal<TipoVehiculo[]>([]);
  tarifas = signal<Tarifa[]>([]);

  // ── Formulario de entrada ──
  showEntrada = signal(false);
  entradaPlaca = signal('');
  entradaTipo = signal<number | null>(null);
  entradaTarifa = signal<number | null>(null);
  entradaObs = signal('');
  savingEntrada = signal(false);

  // ── Salida modal ──
  showSalida = signal(false);
  vehiculoSalida = signal<Vehiculo | null>(null);
  salidaValor = signal<number>(0);
  savingSalida = signal(false);

  // ── Filtros ──
  filtroPlaca = signal('');
  filtroDesde = signal('');
  filtroHasta = signal('');

  // ── Computed ──
  tarifasFiltradas = computed(() => {
    const tipo = this.entradaTipo();
    if (!tipo) return [];
    return this.tarifas().filter(t => t.id_tipo_vehiculo === tipo);
  });

  sinTarifas = computed(() => {
    const tipo = this.entradaTipo();
    return tipo !== null && this.tarifas().length > 0 && this.tarifasFiltradas().length === 0;
  });

  salidaValorCalculado = computed(() => {
    const v = this.vehiculoSalida();
    if (!v?.tarifa) return 0;
    const diffMs    = Math.max(0, Date.now() - this.toUTC(v.fecha_entrada).getTime());
    const mins      = Math.max(1, Math.floor(diffMs / 60000));
    const valor     = Number(v.tarifa.valor);
    const adicional = v.tarifa.valor_adicional != null ? Number(v.tarifa.valor_adicional) : null;
    switch (v.tarifa.tipo_cobro) {
      case 'HORA': {
        const periodos = Math.ceil(mins / 60);
        if (adicional != null && periodos > 1) return valor + adicional * (periodos - 1);
        return periodos * valor;
      }
      case 'FRACCION': {
        const periodos = Math.ceil(mins / 30);
        if (adicional != null && periodos > 1) return valor + adicional * (periodos - 1);
        return periodos * valor;
      }
      case 'DIA':     return Math.ceil(mins / (60 * 24)) * valor;
      case 'MES':     return valor;
      default:        return 0;
    }
  });

  readonly TIPO_ICON: Record<string, string> = {
    'automóvil':   'car',
    'motocicleta': 'bike',
    'bicicleta':   'bike',
    'scuter':      'bike',
    'camioneta':   'truck',
    'camión':      'truck',
    'minibús':     'bus',
    'bus':         'bus',
  };

  tipoIcono(nombre: string): string {
    return this.TIPO_ICON[nombre.toLowerCase()] ?? 'car';
  }

  private get idNeg(): number {
    return this.auth.negocio()?.id_negocio ?? 0;
  }

  ngOnInit(): void {
    this.loadTipos();
    this.loadTarifas();
    this.loadVehiculos();
    this.detectarSoporteCamara();
  }

  ngOnDestroy(): void {
    if (this._scanTimer) clearTimeout(this._scanTimer);
  }

  private detectarSoporteCamara(): void {
    if (typeof (window as any).BarcodeDetector !== 'undefined') {
      this.soportaCamara.set(true);
    }
  }

  // ── Data loading ──
  loadVehiculos(): void {
    this.loading.set(true);
    const neg = this.idNeg;
    const p = this.page();

    if (this.vista() === 'actuales') {
      this.svc.getVehiculosActuales(neg, p, this.filtroPlaca() || undefined).subscribe({
        next: res => {
          if (res.data) {
            this.vehiculos.set(res.data.vehiculos);
            this.total.set(res.data.total);
            this.totalPages.set(res.data.totalPages);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      const filters: { placa?: string; desde?: string; hasta?: string } = {};
      if (this.filtroPlaca()) filters.placa = this.filtroPlaca();
      if (this.filtroDesde()) filters.desde = this.filtroDesde();
      if (this.filtroHasta()) filters.hasta = this.filtroHasta();
      this.svc.getHistorialVehiculos(neg, p, filters).subscribe({
        next: res => {
          if (res.data) {
            this.vehiculos.set(res.data.vehiculos);
            this.total.set(res.data.total);
            this.totalPages.set(res.data.totalPages);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  loadTipos(): void {
    this.svc.getTiposVehiculo(this.idNeg).subscribe({
      next: res => {
        if (res.data) this.tiposVehiculo.set(res.data);
      },
    });
  }

  loadTarifas(): void {
    this.svc.getTarifas(this.idNeg).subscribe({
      next: res => {
        if (res.data) this.tarifas.set(res.data);
      },
    });
  }

  // ── Vista ──
  cambiarVista(v: Vista): void {
    this.vista.set(v);
    this.page.set(1);
    this.filtroPlaca.set('');
    this.filtroDesde.set('');
    this.filtroHasta.set('');
    this.loadVehiculos();
  }

  buscar(): void {
    this.page.set(1);
    this.loadVehiculos();
  }

  irPagina(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadVehiculos();
  }

  // ── Entrada ──
  abrirEntrada(): void {
    this.showEntrada.set(true);
    this.entradaPlaca.set('');
    this.entradaTipo.set(this.tiposVehiculo().length ? this.tiposVehiculo()[0].id_tipo_vehiculo : null);
    this.entradaTarifa.set(null);
    this.entradaObs.set('');
  }

  cerrarEntrada(): void {
    this.showEntrada.set(false);
  }

  guardarEntrada(): void {
    const placa = this.entradaPlaca().trim().toUpperCase();
    const tipo  = this.entradaTipo();
    if (!placa || !tipo) return;

    this.savingEntrada.set(true);
    this.svc.registrarEntrada({
      placa,
      id_tipo_vehiculo: tipo,
      id_negocio: this.idNeg,
      id_tarifa: this.entradaTarifa() ?? undefined,
      observaciones: this.entradaObs() || undefined,
    }).subscribe({
      next: (res) => {
        this.savingEntrada.set(false);
        this.cerrarEntrada();
        this.loadVehiculos();
        if (res.data?.id_factura) {
          this.print.imprimirEntrada(res.data);
        }
      },
      error: () => this.savingEntrada.set(false),
    });
  }

  // ── Salida ──
  abrirSalida(v: Vehiculo): void {
    this.vehiculoSalida.set(v);
    this.showSalida.set(true);
  }

  cerrarSalida(): void {
    this.showSalida.set(false);
    this.vehiculoSalida.set(null);
  }

  guardarSalida(): void {
    const v = this.vehiculoSalida();
    if (!v) return;

    this.savingSalida.set(true);
    this.svc.registrarSalida(v.id_vehiculo, this.idNeg, this.salidaValorCalculado()).subscribe({
      next: (res) => {
        this.savingSalida.set(false);
        this.cerrarSalida();
        this.loadVehiculos();
      },
      error: () => this.savingSalida.set(false),
    });
  }

  onScanManual(e: Event): void {
    if ((e as KeyboardEvent).key !== 'Enter') return;
    const placa = this.scanInput().trim().toUpperCase();
    if (placa.length < 3) return;
    this.procesarScan(placa);
    this.scanInput.set('');
  }

  private procesarScan(placa: string): void {
    if (this.scanLoading()) return;
    this.scanError.set('');
    this.scanLoading.set(true);
    this.svc.buscarVehiculoActivo(placa, this.idNeg).subscribe({
      next: (res) => {
        this.scanLoading.set(false);
        if (res.data) {
          this.abrirSalida(res.data);
        } else {
          this.scanError.set(`No hay vehículo activo con placa ${placa}`);
        }
      },
      error: () => {
        this.scanLoading.set(false);
        this.scanError.set(`Placa ${placa} no encontrada en el parqueadero`);
      },
    });
  }

  // ── Cámara QR scanner ──
  async escanearConCamara(): Promise<void> {
    if (this.scanningCamara()) return;
    this.scanningCamara.set(true);
    this.scanError.set('');

    try {
      const BarcodeDetector = (window as any).BarcodeDetector;
      if (BarcodeDetector) {
        const detector = new BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'code_39'],
        });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', '');
        await video.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const scanLoop = async () => {
          if (!this.scanningCamara()) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              stream.getTracks().forEach(t => t.stop());
              this.scanningCamara.set(false);
              const match = raw.match(/salida-qr\/([a-f0-9]{64})/i);
              if (match) {
                this.procesarScanQRToken(match[1]);
              } else {
                this.procesarScan(raw.toUpperCase());
              }
              return;
            }
          } catch (_) { /* continuar escaneando */ }
          requestAnimationFrame(scanLoop);
        };
        requestAnimationFrame(scanLoop);
        this.mostrarOverlayCamara(video, stream);
      } else {
        this.scanningCamara.set(false);
        this.scanError.set('Este navegador no soporta escaneo con cámara. Use el campo manual.');
      }
    } catch (err: any) {
      this.scanningCamara.set(false);
      this.scanError.set('No se pudo acceder a la cámara. Verifique permisos.');
    }
  }

  private mostrarOverlayCamara(video: HTMLVideoElement, stream: MediaStream): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center';
    video.style.cssText = 'max-width:100%;max-height:80vh;border-radius:8px';
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    btnCancel.style.cssText = 'margin-top:16px;padding:12px 24px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer';
    btnCancel.onclick = () => {
      stream.getTracks().forEach(t => t.stop());
      document.body.removeChild(overlay);
      this.scanningCamara.set(false);
    };
    overlay.appendChild(video);
    overlay.appendChild(btnCancel);
    document.body.appendChild(overlay);
  }

  private procesarScanQRToken(token: string): void {
    this.svc.getVehiculoPorQR(token).subscribe({
      next: (res) => {
        if (res.data) {
          this.vehiculoSalida.set({
            id_vehiculo: res.data.id_vehiculo,
            placa: res.data.placa,
            id_tipo_vehiculo: 0,
            id_negocio: this.idNeg,
            fecha_entrada: res.data.fecha_entrada,
            estado: 'A',
            tipoVehiculo: res.data.tipoVehiculo ?? undefined,
            tarifa: res.data.tarifa ?? undefined,
          });
          this.showSalida.set(true);
        } else {
          this.scanError.set('Vehículo no encontrado o ya salió');
        }
      },
      error: () => {
        this.scanError.set('Error al buscar vehículo por QR');
      },
    });
  }

  // ── Helpers ──
  private toUTC(fecha: string): Date {
    const s = String(fecha);
    if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
    return new Date(s.replace(' ', 'T') + 'Z');
  }

  tiempoTranscurrido(fecha: string): string {
    const diffMs = Date.now() - this.toUTC(fecha).getTime();
    const mins = Math.floor(Math.abs(diffMs) / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const m   = mins % 60;
    return `${hrs}h ${m.toString().padStart(2, '0')}m`;
  }

  formatFecha(fecha: string): string {
    return this.toUTC(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Bogota',
    });
  }

  formatMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
  }
}
