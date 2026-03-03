import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { AuthService } from '../../auth/data-access/auth.service';
import { ConfiguracionParqueadero, TipoVehiculo, Capacidad } from '../../core/models/parqueadero.models';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent implements OnInit {
  private readonly svc = inject(ParqueaderoService);
  private readonly auth = inject(AuthService);

  config = signal<ConfiguracionParqueadero | null>(null);
  tipos = signal<TipoVehiculo[]>([]);
  capacidades = signal<Capacidad[]>([]);
  loading = signal(false);
  saving = signal(false);

  // Form
  nombre = signal('');
  direccion = signal('');
  telefono = signal('');
  horarioApertura = signal('');
  horarioCierre = signal('');

  // Tipo vehiculo form
  showTipo = signal(false);
  tipoNombre = signal('');
  tipoDesc = signal('');
  savingTipo = signal(false);

  private get idNeg(): number {
    return this.auth.negocio()?.id_negocio ?? 0;
  }

  ngOnInit(): void {
    this.load();
    this.loadTipos();
    this.loadCapacidad();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getConfiguracion(this.idNeg).subscribe({
      next: res => {
        const c = res.data ?? null;
        this.config.set(c);
        if (c) {
          this.nombre.set(c.nombre_comercial ?? '');
          this.direccion.set(c.direccion ?? '');
          this.telefono.set(c.telefono ?? '');
          this.horarioApertura.set(c.horario_apertura ?? '');
          this.horarioCierre.set(c.horario_cierre ?? '');
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTipos(): void {
    this.svc.getTiposVehiculo(this.idNeg).subscribe({ next: r => { if (r.data) this.tipos.set(r.data); } });
  }

  loadCapacidad(): void {
    this.svc.getCapacidad(this.idNeg).subscribe({ next: r => { if (r.data) this.capacidades.set(r.data); } });
  }

  guardarConfig(): void {
    this.saving.set(true);
    this.svc.upsertConfiguracion({
      id_negocio: this.idNeg,
      nombre_comercial: this.nombre(),
      direccion: this.direccion(),
      telefono: this.telefono(),
      horario_apertura: this.horarioApertura(),
      horario_cierre: this.horarioCierre(),
    }).subscribe({
      next: () => { this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  guardarCapacidad(idTipo: number, espacios: number): void {
    this.svc.upsertCapacidad({ id_negocio: this.idNeg, id_tipo_vehiculo: idTipo, espacios_total: espacios }).subscribe({
      next: () => this.loadCapacidad(),
    });
  }

  crearTipo(): void {
    this.savingTipo.set(true);
    this.svc.createTipoVehiculo({ nombre: this.tipoNombre(), descripcion: this.tipoDesc() || undefined, id_negocio: this.idNeg }).subscribe({
      next: () => { this.savingTipo.set(false); this.showTipo.set(false); this.tipoNombre.set(''); this.tipoDesc.set(''); this.loadTipos(); },
      error: () => this.savingTipo.set(false),
    });
  }

  getCapacidadPorTipo(idTipo: number): number {
    return this.capacidades().find(c => c.id_tipo_vehiculo === idTipo)?.espacios_total ?? 0;
  }
}
