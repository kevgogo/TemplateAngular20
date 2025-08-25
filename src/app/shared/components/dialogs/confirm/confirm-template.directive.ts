import { Directive, TemplateRef } from '@angular/core';
import { ConfirmState } from './confirm.state'; // ajusta ruta

@Directive({ selector: 'ng-template[confirm]' })
export class ConfirmTemplateDirective {
  constructor(tpl: TemplateRef<void>, state: ConfirmState) {
    state.template = tpl;
  }
}
