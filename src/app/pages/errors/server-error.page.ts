import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonService } from '@core/services/common.service';

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
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <h1 class="display-4 fw-bold">{{ code }}</h1>
          <p class="lead mb-2">{{ title }}</p>
          <p class="text-body-secondary">{{ msg }}</p>

          <div class="d-flex gap-2 justify-content-center mt-3">
            <a routerLink="/home" class="btn btn-primary">Ir al inicio</a>
            <button
              type="button"
              class="btn btn-outline-secondary"
              (click)="recargar()"
            >
              Recargar
            </button>
          </div>

          @if (from) {
            <div class="text-muted small mt-3">
              <span
                >Ocurrió mientras estabas en: <code>{{ from }}</code></span
              >
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ServerErrorPage {
  private readonly common = inject(CommonService);
  private readonly s: ErrorState;

  constructor() {
    if (hasGetLastErrorState(this.common)) {
      this.s = this.common.getLastErrorState<ErrorState>() ?? {};
    } else {
      const st: unknown = window.history.state as unknown;
      this.s = isErrorState(st) ? st : {};
    }
  }

  get code(): string {
    return this.s.code ?? '500';
  }
  get title(): string {
    return this.s.error ?? 'Error interno del servidor';
  }
  get msg(): string {
    return this.s.message ?? 'Ocurrió un problema procesando tu solicitud.';
  }
  get from(): string {
    return this.s.from ?? '';
  }

  recargar(): void {
    window.location.reload();
  }
}
