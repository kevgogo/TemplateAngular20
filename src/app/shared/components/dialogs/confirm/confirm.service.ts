import { Injectable } from '@angular/core';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import {
  ConfirmModalComponent,
  ConfirmOptions,
} from './confirm-modal.component';
import { MessageModalComponent } from '../message/message-modal.component';
import { ConfirmState } from './confirm.state';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private modal: BsModalService, private state: ConfirmState) {}

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.options = options;
      const initialState = {
        options,
        onYes: () => resolve(true),
        onNo: () => resolve(false),
      };
      const content = this.state.template ?? ConfirmModalComponent;
      this.state.modal = this.modal.show(content, {
        class: 'modal-primary',
        initialState,
        ignoreBackdropClick: true,
        keyboard: false,
      });
    });
  }

  message(options: ConfirmOptions): void {
    this.state.options = options;
    const cls = {
      success: 'modal-message modal-success',
      info: 'modal-message modal-info',
      warning: 'modal-message modal-warning',
      error: 'modal-message modal-danger',
    }[options.type_message ?? 'info'];

    const content = this.state.templateMessage ?? MessageModalComponent;
    this.state.modal = this.modal.show(content, {
      class: cls,
      initialState: { options },
      ignoreBackdropClick: true,
      keyboard: false,
    });
  }
}
