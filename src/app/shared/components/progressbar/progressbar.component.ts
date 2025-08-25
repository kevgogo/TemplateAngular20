import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Bootstrap 5 Progressbar (Standalone, Angular 17+ / 20)
 */
export type ProgressType =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'dark'
  | 'light';

export interface ProgressSegment {
  value: number;
  type?: ProgressType;
  label?: string;
  striped?: boolean;
  animated?: boolean;
}

@Component({
  selector: 'progressbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progressbar.component.html',
  styleUrls: ['./progressbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressbarComponent {
  // --- Modo simple ---
  @Input() value = 0;
  @Input() min = 0;
  @Input() max = 100;
  @Input() type: ProgressType = 'primary';
  @Input() striped = false;
  @Input() animated = false;
  @Input() showLabel = true;
  @Input() label?: string;
  /** altura CSS (e.g., '1rem', '20px') */
  @Input() height?: string;

  // --- Modo apilado ---
  @Input() stacked: ProgressSegment[] | null = null;

  // Signals para cálculos reactivos
  private valueSig = signal(this.value);
  private minSig = signal(this.min);
  private maxSig = signal(this.max);
  private stackedSig = signal<ProgressSegment[] | null>(this.stacked);

  ngOnChanges(): void {
    this.valueSig.set(this.value);
    this.minSig.set(this.min);
    this.maxSig.set(this.max);
    this.stackedSig.set(this.stacked);
  }

  // Bootstrap contextual class map
  getTypeClass(t: ProgressType | undefined): string {
    const type = t ?? this.type;
    return `bg-${type}`;
  }

  // Porcentaje (modo simple)
  readonly percent = computed(() => {
    const min = this.minSig();
    const max = this.maxSig();
    const val = this.valueSig();
    const span = Math.max(0, max - min);
    if (span <= 0) return 0;
    const clamped = Math.min(max, Math.max(min, val));
    return ((clamped - min) / span) * 100;
  });

  // Suma de segmentos (modo apilado)
  readonly totalStacked = computed(() => {
    const arr = this.stackedSig() ?? [];
    return arr.reduce((acc, s) => acc + (Number.isFinite(s.value) ? s.value : 0), 0);
  });

  // Denominador para stacked (max si aplica, si no la suma)
  readonly stackedDen = computed(() => {
    const max = this.maxSig();
    const sum = this.totalStacked();
    if (max > 0 && sum <= max) return max;
    return sum || 1; // evita división por cero
  });

  // Ancho (%) de un segmento
  segmentWidth(seg: ProgressSegment): number {
    const den = this.stackedDen();
    const val = Math.max(0, seg.value);
    return (val / den) * 100;
  }

  // Aria helpers
  ariaValueNow(): number {
    const min = this.minSig();
    const max = this.maxSig();
    const span = Math.max(0, max - min);
    if (span <= 0) return 0;
    const clamped = Math.min(max, Math.max(min, this.valueSig()));
    return Math.round(((clamped - min) / span) * 100);
  }
}
