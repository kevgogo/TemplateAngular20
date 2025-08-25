import { Injectable, TemplateRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmOptions } from './confirm-modal.component'; // <-- usa la misma

export type MessageType = 'success' | 'info' | 'warning' | 'error';

@Injectable({ providedIn: 'root' })
export class ConfirmState {
  /** Últimas opciones recibidas */
  options!: ConfirmOptions;

  /** Último modal abierto */
  modal!: BsModalRef;

  /** Templates registrados vía directivas */
  template!: TemplateRef<void>; // para ConfirmModalComponent
  templateMessage!: TemplateRef<void>; // para MessageModalComponent

  /** Promesa devuelta por confirm() */
  result!: Promise<boolean>;

  /** Resolutores internos */
  _resolve?: (v: boolean) => void;
  _reject?: (v: boolean) => void;
}
