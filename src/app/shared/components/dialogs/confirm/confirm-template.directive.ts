// src/app/core/services/confirm/confirm-template.directive.ts
import {
  Directive,
  OnDestroy,
  OnInit,
  TemplateRef,
  inject,
} from '@angular/core';
import { ConfirmState } from './confirm.state'; // ajusta la ruta si difiere

@Directive({
  selector: 'ng-template[appConfirm]',
  standalone: true,
})
export class ConfirmTemplateDirective implements OnInit, OnDestroy {
  // Evita `any`: inyecta como TemplateRef<unknown>
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly state = inject(ConfirmState);

  ngOnInit(): void {
    this.state.template = this.tpl; // Type OK: TemplateRef<unknown> | Type<unknown>
  }

  ngOnDestroy(): void {
    // Limpia solo si sigue apuntando a este template
    if (this.state.template === this.tpl) {
      this.state.template = undefined; // OK si `template` es opcional en ConfirmState
    }
  }
}
