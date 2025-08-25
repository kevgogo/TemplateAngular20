import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  type_message?: 'success' | 'info' | 'warning' | 'error';
  icon?: string;
}

@Component({
  selector: 'confirm-modal-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  // inyectadas vía initialState
  options!: ConfirmOptions;
  onYes!: () => void;
  onNo!: () => void;

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
