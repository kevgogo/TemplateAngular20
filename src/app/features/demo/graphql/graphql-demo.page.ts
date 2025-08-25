// src/app/features/demo/graphql/graphql-demo.page.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GraphQLAuthService } from '@core/graphql/graphql-auth.service';
import { GraphQLClientService } from '@core/graphql/graphql-client.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import { FARMS_QUERY } from './queries';

@Component({
  selector: 'app-graphql-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, SHARED_IMPORTS],
  templateUrl: './graphql-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphqlDemoPage {
  username = '';
  password = '';
  tokenStatus = signal<'idle' | 'ok' | 'error' | 'loading'>('idle');
  query = FARMS_QUERY;
  variablesText = '{\n  "co": true\n}';
  result = signal<any | null>(null);
  error = signal<string | null>(null);

  constructor(
    private auth: GraphQLAuthService,
    private gql: GraphQLClientService
  ) {}

  login() {
    this.tokenStatus.set('loading');
    this.auth.getToken(this.username, this.password).subscribe({
      next: () => this.tokenStatus.set('ok'),
      error: (e) => {
        this.tokenStatus.set('error');
        this.error.set(String(e?.message || e));
      },
    });
  }

  run() {
    this.error.set(null);
    this.result.set(null);
    let vars: any = undefined;
    try {
      vars = this.variablesText ? JSON.parse(this.variablesText) : undefined;
    } catch (e: any) {
      this.error.set('Variables JSON inválidas: ' + (e?.message ?? e));
      return;
    }
    this.gql.execute<any, any>(this.query, vars).subscribe({
      next: (data) => this.result.set(data),
      error: (e) => this.error.set(String(e?.message || e)),
    });
  }
}
