import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

import { GraphQLClientService } from '@core/graphql/graphql-client.service';
import { FARMS_QUERY } from './queries';

// Tipos de ejemplo (ajusta si tu API devuelve campos distintos)
export interface Farm {
  farm_id: number;
  farm_id_colibri?: number | null;
  farm_name: string;
  farm_short_name?: string | null;
}
export interface FarmsQueryResult {
  farms: Farm[];
}

// ===== Helpers de tipos seguros =====
interface GqlPayload {
  query: string;
  variables?: Record<string, unknown>;
}
type GqlCallable<T> = (payload: GqlPayload) => Observable<T>;

function isFunction(x: unknown): x is (...args: unknown[]) => unknown {
  return typeof x === 'function';
}
function bindRunner<T>(
  svc: unknown,
  key: 'request' | 'run' | 'query',
): GqlCallable<T> | null {
  const obj = svc as Record<string, unknown>;
  const fn = obj?.[key];
  return isFunction(fn) ? (fn.bind(svc) as GqlCallable<T>) : null;
}
function pickRunner<T>(svc: unknown): GqlCallable<T> | null {
  return (
    bindRunner<T>(svc, 'request') ??
    bindRunner<T>(svc, 'run') ??
    bindRunner<T>(svc, 'query')
  );
}

@Component({
  selector: 'app-graphql-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './graphql-demo.page.html',
  styleUrls: ['./graphql-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphqlDemoPage {
  private readonly gql = inject(GraphQLClientService);

  // Estado UI
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly data = signal<FarmsQueryResult | null>(null);

  // Parámetros
  onlyCO = true;
  query = FARMS_QUERY;

  consultar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.data.set(null);

    const payload: GqlPayload = {
      query: this.query,
      variables: { co: this.onlyCO },
    };

    const run = pickRunner<FarmsQueryResult>(this.gql);
    if (!run) {
      console.error(
        'No encontré un método público en GraphQLClientService. Esperaba request/run/query(payload).',
      );
      this.loading.set(false);
      this.errorMsg.set('No se encontró método público del cliente GraphQL.');
      return;
    }

    run(payload)
      .pipe(
        take(1), // asume una sola respuesta por request
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (resp) => this.data.set(resp),
        error: (e: unknown) => {
          console.error('GQL error:', e);
          this.errorMsg.set('Error consultando GraphQL.');
        },
      });
  }
}
