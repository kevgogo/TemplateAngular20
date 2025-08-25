import { Directive, OnInit, TemplateRef, inject } from '@angular/core';
import { ConfirmState } from '../confirm/confirm.state';

@Directive({
  selector: '[message]',
  standalone: true,
})
export class MessageTemplateDirective implements OnInit {
  private tpl = inject(TemplateRef<void>);
  private state = inject(ConfirmState);
  ngOnInit(): void {
    this.state.templateMessage = this.tpl;
  }
}
