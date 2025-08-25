import { Directive, TemplateRef } from '@angular/core';
import { ConfirmState } from '../confirm/confirm.state'; // ajusta ruta

@Directive({ selector: 'ng-template[message]' })
export class MessageTemplateDirective {
  constructor(tpl: TemplateRef<void>, state: ConfirmState) {
    state.templateMessage = tpl;
  }
}
