import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { AuthService } from '../../auth/data-access/auth.service';
import { Caja, MovimientoCaja } from '../../core/models/parqueadero.models';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.component.html',
  styleUrl: './caja.component.scss',
})
export class CajaComponent implements OnInit {
  private readonly svc = inject(ParqueaderoService);
  private readonly auth = inject(AuthService);

  cajaAbierta = signal<Caja | null>(null);
  movimientos = signal<MovimientoCaja[]>([]);
  loading = signal(false);

  // Apertura
  showApertura = signal(false);
  montoApertura = signal<number>(0);
  obsApertura = signal('');
  saving = signal(false);

  // Movimiento manual
  showMovimiento = signal(false);
  movTipo = signal<'INGRESO' | 'EGRESO'>('INGRESO');
  movMonto = signal<number>(0);
  movConcepto = signal('');
  savingMov = signal(false);

  private get idNeg(): number {
    return this.auth.negocio()?.id_negocio ?? 0;
  }

  ngOnInit(): void {
    this.loadCaja();
  }

  loadCaja(): void {
    this.loading.set(true);
    this.svc.getCajaAbierta(this.idNeg).subscribe({
      next: res => {
        this.cajaAbierta.set(res.data ?? null);
        if (res.data) this.loadMovimientos(res.data.id_caja);
        this.loading.set(false);
      },
      error: () => { this.cajaAbierta.set(null); this.loading.set(false); },
    });
  }

  loadMovimientos(idCaja: number): void {
    this.svc.getMovimientosCaja(idCaja).subscribe({
      next: res => { if (res.data) this.movimientos.set(res.data); },
    });
  }

  abrirCaja(): void {
    this.saving.set(true);
    this.svc.abrirCaja(this.idNeg, this.montoApertura()).subscribe({
      next: () => { this.saving.set(false); this.showApertura.set(false); this.loadCaja(); },
      error: () => this.saving.set(false),
    });
  }

  cerrarCaja(): void {
    if (!this.cajaAbierta() || !confirm('¿Cerrar la caja actual?')) return;
    this.svc.cerrarCaja(this.cajaAbierta()!.id_caja, this.idNeg).subscribe({
      next: () => this.loadCaja(),
    });
  }

  registrarMovimiento(): void {
    if (!this.cajaAbierta()) return;
    this.savingMov.set(true);
    this.svc.registrarMovimientoCaja({
      id_caja: this.cajaAbierta()!.id_caja,
      tipo: this.movTipo(),
      monto: this.movMonto(),
      concepto: this.movConcepto() || undefined,
    }).subscribe({
      next: () => {
        this.savingMov.set(false);
        this.showMovimiento.set(false);
        this.loadMovimientos(this.cajaAbierta()!.id_caja);
      },
      error: () => this.savingMov.set(false),
    });
  }

  formatMoneda(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
