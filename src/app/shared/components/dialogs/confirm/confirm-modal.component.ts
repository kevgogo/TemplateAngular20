import { Component, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmOptions } from './confirm.service';
@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  standalone: true,
})
export class ConfirmModalComponent {
  @Input() options!: ConfirmOptions;

  // Callbacks inyectadas vía initialState desde el servicio
  onYes?: () => void;
  onNo?: () => void;

  constructor(public bsModalRef: BsModalRef) {}

  yes() {
    this.onYes?.();
    this.bsModalRef.hide();
  }
  no() {
    this.onNo?.();
    this.bsModalRef.hide();
  }
}
