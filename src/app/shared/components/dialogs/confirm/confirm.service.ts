import { inject, Injectable } from '@angular/core';
import type { SafeHtml } from '@angular/platform-browser';
import type { BsModalRef, ModalOptions } from 'ngx-bootstrap/modal';
import { BsModalService } from 'ngx-bootstrap/modal';
import { MessageModalComponent } from '../message/message-modal.component';
import { ConfirmModalComponent } from './confirm-modal.component';
import { ConfirmState } from './confirm.state';

export type MessageType = 'success' | 'info' | 'warning' | 'error';

export interface ConfirmOptions {
  /** Texto plano opcional */
  message?: string;
  /** Contenido HTML opcional: SafeHtml (recomendado) o string */
  html?: SafeHtml | string;
  title?: string;
  type_message?: MessageType;
  okText?: string;
  cancelText?: string;

  /** Tamaño del diálogo */
  size?: 'sm' | 'lg' | 'xl';
  /** Clases extra para el contenedor del modal */
  modalClass?: string;
  /** Backdrop: true | false | 'static' */
  backdrop?: boolean | 'static';
  /** Ignorar click en backdrop para cerrar */
  ignoreBackdropClick?: boolean;
  /** Permitir cerrar con ESC */
  keyboard?: boolean;
  /** Animación fade */
  animated?: boolean;

  /** Extras opcionales, quedan disponibles en el modal */
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal: BsModalService = inject(BsModalService);
  private readonly state: ConfirmState = inject(ConfirmState);

  /** Defaults robustos (centrado + backdrop) */
  private readonly defaultModalOpts: ModalOptions = {
    backdrop: true,
    ignoreBackdropClick: true,
    keyboard: true,
    animated: true,
  };

  /** Espera (si existe) al cierre del modal anterior de forma segura */
  private waitPrevClosed(): Promise<void> {
    const ref: BsModalRef | undefined = (
      this.state as { modal?: BsModalRef | undefined }
    ).modal;

    if (!ref) return Promise.resolve();

    return new Promise<void>((resolve) => {
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        // limpia referencia si el estado la expone como opcional
        if ('modal' in this.state) {
          (this.state as { modal?: BsModalRef | undefined }).modal = undefined;
        }
        resolve();
      };

      const sub = ref.onHidden?.subscribe?.(() => {
        try {
          sub?.unsubscribe?.();
        } catch {
          /* no-op */
        }
        finish();
      });

      try {
        ref.hide();
      } catch {
        finish();
      }

      // Red de seguridad por si onHidden no dispara (animación interrumpida, etc.)
      window.setTimeout(() => {
        try {
          sub?.unsubscribe?.();
        } catch {
          /* no-op */
        }
        finish();
      }, 350);
    });
  }

  /** Muestra un confirm y resuelve a true/false según el botón pulsado */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    this.state.options = options;

    const initialState = {
      options,
      onYes: () => this.state._resolve?.(true),
      onNo: () => this.state._resolve?.(false),
    };

    await this.waitPrevClosed();

    const content = this.state.template ?? ConfirmModalComponent;

    const cls =
      `${options.size ? `modal-${options.size} ` : ''}` +
      `modal-dialog-centered ` +
      `modal-primary ` +
      `${options.modalClass ?? ''}`;

    const modalOpts: ModalOptions = {
      ...this.defaultModalOpts,
      backdrop: options.backdrop ?? this.defaultModalOpts.backdrop,
      ignoreBackdropClick:
        options.ignoreBackdropClick ??
        this.defaultModalOpts.ignoreBackdropClick,
      keyboard: options.keyboard ?? this.defaultModalOpts.keyboard,
      animated: options.animated ?? this.defaultModalOpts.animated,
      class: cls.trim(),
      initialState,
    };

    this.state.result = new Promise<boolean>((resolve) => {
      this.state._resolve = resolve;
    });

    (this.state as { modal?: BsModalRef | undefined }).modal = this.modal.show(
      content,
      modalOpts,
    );

    return this.state.result;
  }

  /** Muestra un mensaje informativo (no retorna promesa) */
  message(options: ConfirmOptions): void {
    this.state.options = options;

    const typeCls =
      {
        success: 'modal-message modal-success',
        info: 'modal-message modal-info',
        warning: 'modal-message modal-warning',
        error: 'modal-message modal-danger',
      }[options.type_message ?? 'info'] ?? 'modal-message modal-info';

    const initialState = { options };

    void this.waitPrevClosed().then(() => {
      const content = this.state.templateMessage ?? MessageModalComponent;

      const cls =
        `${options.size ? `modal-${options.size} ` : ''}` +
        `modal-dialog-centered ` +
        `${typeCls} ` +
        `${options.modalClass ?? ''}`;

      (this.state as { modal?: BsModalRef | undefined }).modal =
        this.modal.show(content, {
          ...this.defaultModalOpts,
          backdrop: options.backdrop ?? this.defaultModalOpts.backdrop,
          ignoreBackdropClick:
            options.ignoreBackdropClick ??
            this.defaultModalOpts.ignoreBackdropClick,
          keyboard: options.keyboard ?? this.defaultModalOpts.keyboard,
          animated: options.animated ?? this.defaultModalOpts.animated,
          class: cls.trim(),
          initialState,
        });
    });
  }
}
