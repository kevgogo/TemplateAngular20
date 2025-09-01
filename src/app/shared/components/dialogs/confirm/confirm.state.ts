import { Injectable, TemplateRef, Type } from '@angular/core';
import type { BsModalRef } from 'ngx-bootstrap/modal';
import type { ConfirmOptions } from './confirm.service';

@Injectable({ providedIn: 'root' })
export class ConfirmState {
  template?: Type<unknown> | TemplateRef<unknown>;
  templateMessage?: TemplateRef<unknown>;

  modal?: BsModalRef;
  result?: Promise<boolean>;
  _resolve?: (v: boolean) => void;
  _reject?: (v: boolean) => void;

  options?: ConfirmOptions;
}
