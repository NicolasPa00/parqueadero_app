import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { AuthService } from '../../auth/data-access/auth.service';
import { Abonado, TipoVehiculo } from '../../core/models/parqueadero.models';

@Component({
  selector: 'app-abonados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './abonados.component.html',
  styleUrl: './abonados.component.scss',
})
export class AbonadosComponent implements OnInit {
  private readonly svc = inject(ParqueaderoService);
  private readonly auth = inject(AuthService);

  abonados = signal<Abonado[]>([]);
  tipos = signal<TipoVehiculo[]>([]);
  loading = signal(false);

  showForm = signal(false);
  editing = signal<Abonado | null>(null);
  formNombre = signal('');
  formDocumento = signal('');
  formTelefono = signal('');
  formPlaca = signal('');
  formTipo = signal<number>(0);
  formInicio = signal('');
  formFin = signal('');
  formValor = signal<number>(0);
  saving = signal(false);

  private get idNeg(): number {
    return this.auth.negocio()?.id_negocio ?? 0;
  }

  ngOnInit(): void {
    this.load();
    this.svc.getTiposVehiculo(this.idNeg).subscribe({ next: r => { if (r.data) this.tipos.set(r.data); } });
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAbonados(this.idNeg).subscribe({
      next: res => { if (res.data) this.abonados.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  abrir(a?: Abonado): void {
    if (a) {
      this.editing.set(a);
      this.formNombre.set(a.nombre);
      this.formDocumento.set(a.documento ?? '');
      this.formTelefono.set(a.telefono ?? '');
      this.formPlaca.set(a.placa);
      this.formTipo.set(a.id_tipo_vehiculo);
      this.formInicio.set(a.fecha_inicio?.split('T')[0] ?? '');
      this.formFin.set(a.fecha_fin?.split('T')[0] ?? '');
      this.formValor.set(a.valor_mensualidad);
    } else {
      this.editing.set(null);
      this.formNombre.set(''); this.formDocumento.set(''); this.formTelefono.set(''); this.formPlaca.set('');
      this.formTipo.set(this.tipos().length ? this.tipos()[0].id_tipo_vehiculo : 0);
      this.formInicio.set(''); this.formFin.set(''); this.formValor.set(0);
    }
    this.showForm.set(true);
  }

  cerrar(): void { this.showForm.set(false); }

  guardar(): void {
    this.saving.set(true);
    const data: Partial<Abonado> & { id_negocio: number } = {
      id_negocio: this.idNeg,
      nombre: this.formNombre(),
      documento: this.formDocumento() || undefined,
      telefono: this.formTelefono() || undefined,
      placa: this.formPlaca().toUpperCase(),
      id_tipo_vehiculo: this.formTipo(),
      fecha_inicio: this.formInicio(),
      fecha_fin: this.formFin(),
      valor_mensualidad: this.formValor(),
    };
    const obs = this.editing()
      ? this.svc.updateAbonado(this.editing()!.id_abonado, data)
      : this.svc.createAbonado(data);

    obs.subscribe({
      next: () => { this.saving.set(false); this.cerrar(); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  formatMoneda(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
  }
}
