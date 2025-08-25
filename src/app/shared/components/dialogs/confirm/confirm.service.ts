import { Injectable } from '@angular/core';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { ConfirmModalComponent } from './confirm-modal.component';
import { MessageModalComponent } from '../message/message-modal.component';
import { ConfirmState } from './confirm.state';
import { SafeHtml } from '@angular/platform-browser';

export type MessageType = 'success' | 'info' | 'warning' | 'error';

export interface ConfirmOptions {
  // Texto plano opcional
  message?: string;
  // Contenido HTML opcional: SafeHtml (recomendado) o string
  html?: SafeHtml | string;
  title?: string;
  type_message?: MessageType;
  okText?: string;
  cancelText?: string;
  // Extras opcionales, quedan disponibles en el modal
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private modal: BsModalService, private state: ConfirmState) {}

  async confirm(options: ConfirmOptions): Promise<boolean> {
    this.state.options = options;

    // callbacks para el modal
    const initialState = {
      options,
      onYes: () => this.state._resolve?.(true),
      onNo: () => this.state._resolve?.(false),
    };

    // cierra modal previo si existe
    if (this.state.modal) {
      try {
        this.state.modal.hide();
      } catch {}
    }

    // usa plantilla si está registrada; si no, el componente por defecto
    const content = this.state.template ?? ConfirmModalComponent;

    const modalOpts: ModalOptions = {
      class: 'modal-primary',
      initialState,
      ignoreBackdropClick: true, // evita cierres accidentales
      keyboard: false,
    };

    this.state.result = new Promise<boolean>(
      (resolve) => (this.state._resolve = resolve)
    );
    this.state.modal = this.modal.show(content, modalOpts);
    return this.state.result;
  }

  message(options: ConfirmOptions): void {
    this.state.options = options;

    const cls = {
      success: 'modal-message modal-success',
      info: 'modal-message modal-info',
      warning: 'modal-message modal-warning',
      error: 'modal-message modal-danger',
    }[options.type_message ?? 'info'];

    const initialState = { options };

    if (this.state.modal) {
      try {
        this.state.modal.hide();
      } catch {}
    }

    const content = this.state.templateMessage ?? MessageModalComponent;

    this.state.modal = this.modal.show(content, {
      class: cls,
      initialState,
    });
  }
}
