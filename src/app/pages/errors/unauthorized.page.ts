import { Component } from '@angular/core';
import { CommonService } from '@core/services/common.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

interface ErrorState {
  code?: string;
  error?: string;
  message?: string;
  from?: string;
  ts?: number;
}

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <h1 class="display-4 fw-bold">{{ code }}</h1>
          <p class="lead mb-2">{{ title }}</p>
          <p class="text-body-secondary">{{ msg }}</p>

          <div class="d-flex gap-2 justify-content-center mt-3">
            <a
              [routerLink]="['/login']"
              [queryParams]="{ returnUrl: from || '/' }"
              class="btn btn-primary"
            >
              Iniciar sesión
            </a>
            <button
              type="button"
              class="btn btn-outline-secondary"
              (click)="historyBack()"
            >
              Volver
            </button>
          </div>

          <div class="text-muted small mt-3" *ngIf="from">
            <span
              >Estabas en: <code>{{ from }}</code></span
            >
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UnauthorizedPage {
  private s: ErrorState;
  constructor(private common: CommonService) {
    this.s =
      (this.common as any).getLastErrorState?.() ??
      (history.state as ErrorState) ??
      {};
  }
  get code() {
    return this.s?.code ?? '401';
  }
  get title() {
    return this.s?.error ?? 'No autorizado';
  }
  get msg() {
    return this.s?.message ?? 'Tu sesión no es válida o ha caducado.';
  }
  get from() {
    return this.s?.from ?? '';
  }
  historyBack() {
    history.length > 1 ? history.back() : location.assign('/');
  }
}
