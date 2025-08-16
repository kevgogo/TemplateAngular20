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
  selector: 'app-not-found',
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
            <a routerLink="/dashboard" class="btn btn-primary"
              >Ir al dashboard</a
            >
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
              >Ruta solicitada: <code>{{ from }}</code></span
            >
          </div>
        </div>
      </div>
    </div>
  `,
})
export class NotFoundPage {
  private s: ErrorState;
  constructor(private common: CommonService) {
    this.s =
      (this.common as any).getLastErrorState?.() ??
      (history.state as ErrorState) ??
      {};
  }

  get code() {
    return this.s?.code ?? '404';
  }
  get title() {
    return this.s?.error ?? 'Página no encontrada';
  }
  get msg() {
    return (
      this.s?.message ?? 'La ruta que intentaste abrir no existe o fue movida.'
    );
  }
  get from() {
    return this.s?.from ?? '';
  }

  historyBack() {
    history.length > 1 ? history.back() : location.assign('/');
  }
}
