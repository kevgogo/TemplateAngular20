// src/app/features/demo/modals/modal-inject-demo.page.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-inject-demo',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './modal-inject-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalInjectDemoPage {
  private readonly modal: BsModalService = inject(BsModalService);

  openUserCard(): void {
    const initialState: Partial<UserCardComponent> = {
      user: {
        name: 'Ada Lovelace',
        role: 'Mathematician',
        email: 'ada@lovelace.org',
      },
    };

    const opts: ModalOptions = {
      initialState,
      class: 'modal-lg',
    };

    this.modal.show(UserCardComponent, opts);
  }
}

// ================= Contenido inyectado dinámicamente =================

@Component({
  standalone: true,
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="modal-header">
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
          <i class="fa fa-user fs-4"></i>
        </div>
        <div>
          <div class="fw-bold">{{ user?.name }}</div>
          <div class="text-body-secondary">{{ user?.role }}</div>
          <a [href]="'mailto:' + user?.email">{{ user?.email }}</a>
        </div>
      </div>
    </div>
  `,
})
export class UserCardComponent {
  public readonly bsModalRef: BsModalRef = inject(BsModalRef);
  @Input() user?: { name: string; role: string; email: string };
}
