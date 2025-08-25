import { Injectable, TemplateRef } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmOptions } from './confirm.service'; // re-usa el modelo

@Injectable({ providedIn: 'root' })
export class ConfirmState {
  options!: ConfirmOptions;
  modal!: BsModalRef;
  template!: TemplateRef<void>;
  templateMessage!: TemplateRef<void>;
  result!: Promise<boolean>;
  _resolve?: (v: boolean) => void;
  _reject?: (v: boolean) => void;
}
