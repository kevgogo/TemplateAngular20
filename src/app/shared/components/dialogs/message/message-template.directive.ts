// src/app/core/services/confirm/message-template.directive.ts
import {
  Directive,
  OnDestroy,
  OnInit,
  TemplateRef,
  inject,
} from '@angular/core';
import { ConfirmState } from '../confirm/confirm.state'; // ajusta si tu ruta difiere

@Directive({
  selector: 'ng-template[appMessage]',
  standalone: true,
})
export class MessageTemplateDirective implements OnInit, OnDestroy {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly state = inject(ConfirmState);

  ngOnInit(): void {
    this.state.templateMessage = this.tpl;
  }

  ngOnDestroy(): void {
    if (this.state.templateMessage === this.tpl) {
      this.state.templateMessage = undefined;
    }
  }
}
