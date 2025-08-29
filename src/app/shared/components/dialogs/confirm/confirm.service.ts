import { Injectable } from '@angular/core';
import { BsModalService, ModalOptions, BsModalRef } from 'ngx-bootstrap/modal';
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

  // === NUEVO: opciones de modal sin romper llamadas actuales ===
  size?: 'sm' | 'lg' | 'xl'; // tamaño del diálogo
  modalClass?: string; // clases extra para el contenedor
  backdrop?: boolean | 'static'; // true | false | 'static'
  ignoreBackdropClick?: boolean; // override por llamada
  keyboard?: boolean; // permitir ESC
  animated?: boolean; // animación fade

  // Extras opcionales, quedan disponibles en el modal
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private modal: BsModalService, private state: ConfirmState) {}

  // === opciones por defecto “robustas” para backdrop y centrado ===
  private readonly defaultModalOpts: ModalOptions = {
    backdrop: true, // muestra backdrop (puedes pasar 'static' en options.backdrop)
    ignoreBackdropClick: true, // evita cierre accidental por clic fuera
    keyboard: true, // permitir ESC
    animated: true, // fade
  };

  // === FIX: esperar a que el modal previo termine de cerrarse ===
  private async waitPrevClosed(): Promise<void> {
    const ref = this.state.modal as BsModalRef | undefined;
    if (!ref) return;

    // Si ya no está visible, limpia y sal
    if (!(ref as any).isShown) {
      this.state.modal = undefined as any;
      return;
    }

    await new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        this.state.modal = undefined as any;
        resolve();
      };

      const sub = ref.onHidden?.subscribe?.(() => {
        try {
          sub?.unsubscribe?.();
        } catch {}
        done();
      });

      // Dispara el cierre (activará onHidden)
      try {
        ref.hide();
      } catch {
        done();
      }

      // Red de seguridad por si onHidden no dispara (p.ej. animación cortada)
      setTimeout(() => {
        try {
          sub?.unsubscribe?.();
        } catch {}
        done();
      }, 350); // ~duración del fade por defecto
    });
  }

  async confirm(options: ConfirmOptions): Promise<boolean> {
    this.state.options = options;

    // callbacks para el modal
    const initialState = {
      options,
      onYes: () => this.state._resolve?.(true),
      onNo: () => this.state._resolve?.(false),
    };

    await this.waitPrevClosed();

    // usa plantilla si está registrada; si no, el componente por defecto
    const content = this.state.template ?? ConfirmModalComponent;

    // clase compuesta (tamaño + centrado + clase base + extra)
    const cls =
      `${options.size ? `modal-${options.size} ` : ''}` +
      `modal-dialog-centered ` + // centra vertical
      `modal-primary ` + // clase existente que usabas
      `${options.modalClass ?? ''}`;

    // fusiona overrides por llamada con defaults
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

    this.state.result = new Promise<boolean>(
      (resolve) => (this.state._resolve = resolve)
    );
    this.state.modal = this.modal.show(content, modalOpts);
    return this.state.result;
  }

  message(options: ConfirmOptions): void {
    this.state.options = options;

    const typeCls = {
      success: 'modal-message modal-success',
      info: 'modal-message modal-info',
      warning: 'modal-message modal-warning',
      error: 'modal-message modal-danger',
    }[options.type_message ?? 'info'];

    const initialState = { options };

    // FIX: espera cierre real del modal anterior SIN cambiar la firma (void)
    this.waitPrevClosed().then(() => {
      const content = this.state.templateMessage ?? MessageModalComponent;

      // clase compuesta también para message
      const cls =
        `${options.size ? `modal-${options.size} ` : ''}` +
        `modal-dialog-centered ` +
        `${typeCls} ` +
        `${options.modalClass ?? ''}`;

      // aplicar defaults + overrides para message()
      this.state.modal = this.modal.show(content, {
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
