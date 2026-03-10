import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  CircleX,
} from 'lucide-angular';
import { ParqueaderoService } from '../../core/data-access/parqueadero.service';
import { AuthService } from '../../auth/data-access/auth.service';
import { Tarifa, TipoVehiculo } from '../../core/models/parqueadero.models';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './tarifas.component.html',
  styleUrl: './tarifas.component.scss',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Car, Bike, Truck, Bus, TriangleAlert, CircleX }),
    },
  ],
})
export class TarifasComponent implements OnInit {
  private readonly svc = inject(ParqueaderoService);
  private readonly auth = inject(AuthService);

  tarifas = signal<Tarifa[]>([]);
  tipos = signal<TipoVehiculo[]>([]);
  loading = signal(false);

  showForm = signal(false);
  editing = signal<Tarifa | null>(null);
  formTipo = signal<number>(0);
  formTipoCobro = signal<'HORA' | 'FRACCION' | 'DIA' | 'MES'>('HORA');
  formValor = signal<number>(0);
  formDescripcion = signal('');
  formError = signal<string>('');
  saving = signal(false);

  // Computed: detecta si el tipo seleccionado ya tiene una tarifa activa
  tieneTarifaEnForm = computed(() => {
    const idTipo = this.formTipo();
    const isEditing = !!this.editing();
    return this.tarifas().some(t => 
      t.id_tipo_vehiculo === idTipo && 
      t.estado === 'A' &&
      (!isEditing || t.id_tarifa !== this.editing()!.id_tarifa)
    );
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
    this.load();
    this.loadTipos();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getTarifas(this.idNeg).subscribe({
      next: res => {
        if (res.data) this.tarifas.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTipos(): void {
    this.svc.getTiposVehiculo(this.idNeg).subscribe({
      next: res => { if (res.data) this.tipos.set(res.data); },
    });
  }

  abrir(tarifa?: Tarifa): void {
    this.formError.set('');
    if (tarifa) {
      this.editing.set(tarifa);
      this.formTipo.set(tarifa.id_tipo_vehiculo);
      this.formTipoCobro.set(tarifa.tipo_cobro);
      this.formValor.set(tarifa.valor);
      this.formDescripcion.set(tarifa.descripcion ?? '');
    } else {
      this.editing.set(null);
      this.formTipo.set(this.tipos().length ? this.tipos()[0].id_tipo_vehiculo : 0);
      this.formTipoCobro.set('HORA');
      this.formValor.set(0);
      this.formDescripcion.set('');
    }
    this.showForm.set(true);
  }

  cerrar(): void {
    this.showForm.set(false);
    this.formError.set('');
  }

  guardar(): void {
    this.saving.set(true);
    this.formError.set('');
    const data = {
      id_tipo_vehiculo: this.formTipo(),
      id_negocio: this.idNeg,
      tipo_cobro: this.formTipoCobro(),
      valor: this.formValor(),
      descripcion: this.formDescripcion() || undefined,
    };

    const obs = this.editing()
      ? this.svc.updateTarifa(this.editing()!.id_tarifa, data)
      : this.svc.createTarifa(data);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.cerrar();
        this.load();
      },
      error: (err: any) => {
        this.saving.set(false);
        // Detectar error 409 (Conflict) cuando ya existe tarifa para ese tipo
        if (err.status === 409) {
          this.formError.set('Ya existe una tarifa para este tipo de vehículo. Edítala o elimínala antes.');
        } else {
          this.formError.set('Error al guardar la tarifa');
        }
      },
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Eliminar esta tarifa?')) return;
    this.svc.deleteTarifa(id, this.idNeg).subscribe({ next: () => this.load() });
  }

  formatMoneda(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
  }
}
