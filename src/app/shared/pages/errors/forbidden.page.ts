import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CommonService } from '@core/services/common.service';

type ErrorState = {
  code?: string;
  error?: string;
  message?: string;
  from?: string;
  ts?: number;
};

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <h1 class="display-4 fw-bold">{{ code }}</h1>
          <p class="lead mb-2">{{ title }}</p>
          <p class="text-body-secondary">{{ msg }}</p>

          <div class="d-flex gap-2 justify-content-center mt-3">
            <a routerLink="/dashboard" class="btn btn-primary">Ir al inicio</a>
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
              >Intentaste acceder: <code>{{ from }}</code></span
            >
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForbiddenPage {
  private s: ErrorState;
  constructor(private common: CommonService) {
    // Si más adelante agregas common.getLastErrorState(), se usará; si no, usa history.state
    this.s =
      (this.common as any).getLastErrorState?.() ??
      (history.state as ErrorState) ??
      {};
  }

  get code() {
    return this.s?.code ?? '403';
  }
  get title() {
    return this.s?.error ?? 'Acceso denegado';
  }
  get msg() {
    return this.s?.message ?? 'No tienes permisos para ver esta sección.';
  }
  get from() {
    return this.s?.from ?? '';
  }

  historyBack() {
    history.length > 1 ? history.back() : location.assign('/');
  }
}
