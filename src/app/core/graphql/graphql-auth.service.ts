// src/app/core/graphql/graphql-auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import { map, tap } from 'rxjs/operators';
import { SettingsService } from '@core/services/settings.service';
import {
  GRAPHQL_USER_TOKEN,
  GRAPHQL_PASSWORD_TOKEN,
} from '@core/tokens/app-tokens';

@Injectable({ providedIn: 'root' })
export class GraphQLAuthService {
  private urls = API_URLS();
  private user = inject(GRAPHQL_USER_TOKEN);
  private pass = inject(GRAPHQL_PASSWORD_TOKEN);

  constructor(private http: HttpClient, private settings: SettingsService) {}

  /** Si no pasas params, usa los tokens (por ambiente) */
  getGraphQLToken(username = this.user, password = this.pass) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http
      .post<{ token: string }>(
        this.urls.GRAPHQL.TOKEN,
        { username, password },
        { headers }
      )
      .pipe(
        map((r) => r?.token),
        tap((t) => t && this.settings.setUserSetting('tokenGraphQL', t))
      );
  }
}
