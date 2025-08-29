import { Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmOptions } from '../confirm/confirm.service'; // ajusta la ruta
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  standalone: true,
  imports: [SHARED_IMPORTS],
})
export class MessageModalComponent {
  @Input() options!: ConfirmOptions;

  constructor(public bsModalRef: BsModalRef) {}

  get iconClass() {
    const t = this.options?.type_message ?? 'info';
    return {
      success: 'fa fa-check-circle-fill text-success',
      info: 'fa fa-info-circle-fill text-info',
      warning: 'fa fa-exclamation-triangle-fill text-warning',
      error: 'fa fa-x-circle-fill text-danger',
    }[t];
  }

  get btnClass() {
    const t = this.options?.type_message ?? 'info';
    return {
      success: 'btn btn-success',
      info: 'btn btn-info',
      warning: 'btn btn-warning',
      error: 'btn btn-danger',
    }[t];
  }

  close() {
    this.bsModalRef.hide();
  }
}
