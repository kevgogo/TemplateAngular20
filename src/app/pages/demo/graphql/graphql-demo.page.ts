import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

@Component({
  selector: 'app-graphql-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './graphql-demo.page.html',
  styleUrls: ['./graphql-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphqlDemoPage {
  private gql = inject(GraphQLClientService);

  // Estado UI
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  data = signal<FarmsQueryResult | null>(null);

  // Parámetros
  onlyCO = true;
  query = FARMS_QUERY;

  consultar(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    this.data.set(null);

    const vars = { co: this.onlyCO };

    // ⚠️ IMPORTANTE:
    // Tu servicio tiene un método PÚBLICO que recibe UN SOLO objeto { query, variables }.
    // En distintos proyectos lo hemos llamado request / run / query.
    // Debajo intento resolverlo sin tocar tu servicio:
    const svc: any = this.gql as any;
    const payload = { query: this.query, variables: vars };

    let call:
      | ((p: { query: string; variables?: Record<string, unknown> }) => any)
      | undefined;

    call =
      (typeof svc.request === 'function' && svc.request.bind(svc)) ||
      (typeof svc.run === 'function' && svc.run.bind(svc)) ||
      (typeof svc.query === 'function' && svc.query.bind(svc));

    if (!call) {
      // Último recurso si el wrapper tiene otro nombre.
      console.error(
        'No encontré un método público en GraphQLClientService. Esperaba request/run/query(payload).'
      );
      this.loading.set(false);
      this.errorMsg.set('No se encontró método público del cliente GraphQL.');
      return;
    }

    (call(payload) as import('rxjs').Observable<FarmsQueryResult>).subscribe({
      next: (resp) => {
        this.data.set(resp);
        this.loading.set(false);
      },
      error: (e: unknown) => {
        console.error('GQL error:', e);
        this.errorMsg.set('Error consultando GraphQL.');
        this.loading.set(false);
      },
    });
  }
}
