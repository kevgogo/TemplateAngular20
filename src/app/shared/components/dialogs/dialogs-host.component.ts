import { Component } from '@angular/core';
import { ConfirmTemplateDirective } from './confirm/confirm-template.directive';
import { MessageTemplateDirective } from './message/message-template.directive';
import { ConfirmModalComponent } from './confirm/confirm-modal.component';
import { MessageModalComponent } from './message/message-modal.component';

@Component({
  selector: 'app-dialogs-host',
  standalone: true,
  imports: [
    ConfirmTemplateDirective,
    MessageTemplateDirective,
    ConfirmModalComponent,
    MessageModalComponent,
  ],
  template: `
    <!-- Plantilla para confirm() -->
    <ng-template confirm>
      <confirm-modal-component />
    </ng-template>

    <!-- Plantilla para message() -->
    <ng-template message>
      <message-modal-component />
    </ng-template>
  `,
})
export class DialogsHostComponent {}
