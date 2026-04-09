import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ResumenPeriodo } from '../../../../core/models/reporte.models';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './kpi-cards.component.html',
  styleUrls: ['./kpi-cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardsComponent {
  @Input() resumen: ResumenPeriodo | null = null;
  @Input() cargando = false;

  /** Formatea una duración en minutos a "Xh Ym" */
  formatDuracion(minutos: number | null | undefined): string {
    if (minutos == null) return '—';
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  /** Devuelve clase CSS para el indicador de crecimiento MoM */
  growthClass(val: number | null | undefined): string {
    if (val == null) return '';
    return val >= 0 ? 'positivo' : 'negativo';
  }

  /** Formatea ±% de crecimiento */
  formatGrowth(val: number | null | undefined): string {
    if (val == null) return '';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${(+val).toFixed(1)}%`;
  }
}
