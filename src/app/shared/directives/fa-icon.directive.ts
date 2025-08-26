import { Directive, HostBinding, Input, OnChanges } from '@angular/core';

type FaStyle = 'solid' | 'regular' | 'brands';
type FaSize =
  | 'sm'
  | 'lg'
  | 'xl'
  | '2xs'
  | 'xs'
  | '2x'
  | '3x'
  | '4x'
  | '5x'
  | '6x'
  | '7x'
  | '8x'
  | '9x'
  | '10x';

@Directive({
  selector: 'i[faIcon], span[faIcon], div[faIcon]',
  standalone: true,
})
export class FaIconDirective implements OnChanges {
  /** Nombre del ícono, p.ej. 'gear', 'user', 'truck', 'whatsapp' */
  @Input('faIcon') name = '';

  /** Estilo del set: solid | regular | brands */
  @Input() style: FaStyle = 'solid';

  /** Tamaño opcional: 'lg', 'xl', '2x', '3x', ... */
  @Input() size?: FaSize;

  /** Animación */
  @Input() spin = false;
  @Input() pulse = false;

  /** Ancho fijo (útil para menús) */
  @Input() fixedWidth = false;

  @HostBinding('class') className = 'fa-solid';

  ngOnChanges(): void {
    const styleClass =
      this.style === 'regular'
        ? 'fa-regular'
        : this.style === 'brands'
        ? 'fa-brands'
        : 'fa-solid';

    const parts = new Set<string>([styleClass, `fa-${this.name}`]);

    if (this.size) parts.add(`fa-${this.size}`);
    if (this.spin) parts.add('fa-spin');
    if (this.pulse) parts.add('fa-pulse');
    if (this.fixedWidth) parts.add('fa-fw');

    this.className = Array.from(parts).join(' ');
  }
}
