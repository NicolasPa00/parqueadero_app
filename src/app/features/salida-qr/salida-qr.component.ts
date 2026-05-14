import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  LUCIDE_ICONS,
  LucideIconProvider,
  Car,
  Bike,
  Truck,
  Bus,
  Clock,
  Banknote,
  CheckCircle2,
  XCircle,
  LoaderCircle,
} from 'lucide-angular';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { VehiculoQR, SalidaQRResponse } from '../../core/models/parqueadero.models';

@Component({
  selector: 'app-salida-qr',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './salida-qr.component.html',
  styleUrl: './salida-qr.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Car, Bike, Truck, Bus, Clock, Banknote, CheckCircle2, XCircle, LoaderCircle,
      }),
    },
  ],
})
export class SalidaQrComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(ParqueaderoService);

  token = signal('');
  vehiculo = signal<VehiculoQR | null>(null);
  loading = signal(true);
  error = signal('');
  saving = signal(false);
  salidaExitosa = signal<SalidaQRResponse | null>(null);

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  readonly TIPO_ICON: Record<string, string> = {
    'automóvil': 'car', 'motocicleta': 'bike', 'bicicleta': 'bike',
    'scuter': 'bike', 'camioneta': 'truck', 'camión': 'truck',
    'minibús': 'bus', 'bus': 'bus',
  };

  tipoIcono(nombre: string): string {
    return this.TIPO_ICON[nombre?.toLowerCase()] ?? 'car';
  }

  ngOnInit(): void {
    const t = this.route.snapshot.paramMap.get('token') || '';
    this.token.set(t);
    if (!t) {
      this.error.set('QR no válido');
      this.loading.set(false);
      return;
    }
    this.loadVehiculo();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  private loadVehiculo(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.getVehiculoPorQR(this.token()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data) {
          this.vehiculo.set(res.data);
          // Refrescar cada 30s el costo
          this.refreshTimer = setInterval(() => this.refreshCosto(), 30000);
        } else {
          this.error.set('Vehículo no encontrado o ya salió');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Error al cargar la información del vehículo');
      },
    });
  }

  private refreshCosto(): void {
    this.svc.getVehiculoPorQR(this.token()).subscribe({
      next: (res) => {
        if (res.data) this.vehiculo.set(res.data);
      },
    });
  }

  confirmarSalida(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.svc.confirmarSalidaQR(this.token()).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.data) {
          this.salidaExitosa.set(res.data);
          this.vehiculo.set(null);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Error al procesar la salida');
      },
    });
  }

  volverAEscanear(): void {
    this.router.navigate(['/scan-qr']);
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha + (fecha.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(fecha) ? '' : 'Z'));
    return d.toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Bogota',
    });
  }
}
