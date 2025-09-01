import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonService } from '@core/services/common.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

interface ErrorState {
  code?: string;
  error?: string;
  message?: string;
  from?: string;
  ts?: number;
}

interface HasGetLastErrorState {
  getLastErrorState<T extends ErrorState>(): T;
}

function hasGetLastErrorState(obj: unknown): obj is HasGetLastErrorState {
  return (
    !!obj &&
    typeof (obj as { getLastErrorState?: unknown }).getLastErrorState ===
      'function'
  );
}
function isErrorState(x: unknown): x is ErrorState {
  return typeof x === 'object' && x !== null;
}

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly common = inject(CommonService);
  private readonly s: ErrorState;

  constructor() {
    // Preferimos el estado que pasa CommonService (si existe); si no, fallback a history.state
    if (hasGetLastErrorState(this.common)) {
      this.s = this.common.getLastErrorState<ErrorState>() ?? {};
    } else {
      const st: unknown = window.history.state as unknown;
      this.s = isErrorState(st) ? st : {};
    }
  }

  get code(): string {
    return this.s.code ?? '401';
  }
  get title(): string {
    return this.s.error ?? 'No autorizado';
  }
  get msg(): string {
    return this.s.message ?? 'Tu sesión no es válida o ha caducado.';
  }
  get from(): string {
    return this.s.from ?? '';
  }

  historyBack(): void {
    if (window.history.length > 1) window.history.back();
    else window.location.assign('/');
  }
}
