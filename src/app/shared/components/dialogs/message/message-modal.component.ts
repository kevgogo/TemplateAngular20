import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmOptions } from '../confirm/confirm-modal.component';

@Component({
  selector: 'message-modal-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-modal.component.html',
})
export class MessageModalComponent {
  options!: ConfirmOptions;

  iconClass = 'bi bi-info-circle';
  btnClass = 'btn btn-info';

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    switch (this.options?.type_message) {
      case 'warning':
        this.iconClass = 'bi bi-exclamation-triangle';
        this.btnClass = 'btn btn-warning';
        break;
      case 'success':
        this.iconClass = 'bi bi-check-circle';
        this.btnClass = 'btn btn-success';
        break;
      case 'error':
        this.iconClass = 'bi bi-x-circle';
        this.btnClass = 'btn btn-danger';
        break;
      default:
        this.iconClass = 'bi bi-info-circle';
        this.btnClass = 'btn btn-info';
        break;
    }
    if (this.options?.icon) this.iconClass = this.options.icon;
  }

  close() {
    this.bsModalRef.hide();
  }
}
