import { Directive, OnInit, TemplateRef, inject } from '@angular/core';
import { ConfirmState } from './confirm.state';

@Directive({
  selector: '[confirm]',
  standalone: true,
})
export class ConfirmTemplateDirective implements OnInit {
  private tpl = inject(TemplateRef<void>);
  private state = inject(ConfirmState);
  ngOnInit(): void {
    this.state.template = this.tpl;
  }
}
