import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent {
  /** Bootstrap contextual type */
  @Input() type:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'light'
    | 'dark' = 'warning';

  /** Mostrar botón de cerrar */
  @Input() closeable = false;

  /** Texto simple (también puedes usar <ng-content>) */
  @Input() message = '';

  /** Evento emitido al cerrar */
  @Output() close = new EventEmitter<void>();

  /** Estado interno para ocultar el alert al cerrar */
  isOpen = true;

  _close(): void {
    this.isOpen = false;
    this.close.emit();
  }
}
