// src/app/features/demo/modals/modal-inject-demo.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-inject-demo',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './modal-inject-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalInjectDemoPage {
  constructor(private modal: BsModalService) {}

  openUserCard() {
    const initialState = {
      user: {
        name: 'Ada Lovelace',
        role: 'Mathematician',
        email: 'ada@lovelace.org',
      },
    };
    this.modal.show(UserCardComponent, {
      initialState,
      class: 'modal-lg',
    } as ModalOptions);
  }
}

// Contenido a inyectar dinámicamente
import { Input } from '@angular/core';
@Component({
  standalone: true,
  selector: 'app-user-card',

  template: ` <div class="modal-header">
      <h5 class="modal-title">Usuario</h5>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="bsModalRef.hide()"
      ></button>
    </div>
    <div class="modal-body">
      <div class="d-flex align-items-center gap-3">
        <div
          class="avatar rounded-circle bg-body-secondary d-inline-flex align-items-center justify-content-center"
          style="width:56px;height:56px"
        >
          <i class="bi bi-person fs-4"></i>
        </div>
        <div>
          <div class="fw-bold">{{ user?.name }}</div>
          <div class="text-body-secondary">{{ user?.role }}</div>
          <a [href]="'mailto:' + user?.email">{{ user?.email }}</a>
        </div>
      </div>
    </div>`,
})
export class UserCardComponent {
  @Input() user?: { name: string; role: string; email: string };
  constructor(public bsModalRef: BsModalRef) {}
}
