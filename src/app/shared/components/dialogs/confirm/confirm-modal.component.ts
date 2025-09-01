import { Component, inject, Input } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmOptions } from './confirm.service';
@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  standalone: true,
})
export class ConfirmModalComponent {
  public bsModalRef: BsModalRef = inject(BsModalRef);
  @Input() options!: ConfirmOptions;

  // Callbacks inyectadas vía initialState desde el servicio
  onYes?: () => void;
  onNo?: () => void;

  yes() {
    this.onYes?.();
    this.bsModalRef.hide();
  }
  no() {
    this.onNo?.();
    this.bsModalRef.hide();
  }
}
