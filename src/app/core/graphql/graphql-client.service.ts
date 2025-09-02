import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import {
  GqlOptions,
  GqlVariables,
  GraphQLResponse,
} from '@core/models/graphql.types';

import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GraphQLClientService {
  private readonly urls = API_URLS();
  private http: HttpClient = inject(HttpClient);

  isAlive(timeoutMs = 1200): Observable<boolean> {
    const q = encodeURIComponent('{ __typename }');
    const url = `${this.urls.GRAPHQL.ENDPOINT}?hc=1&query=${q}&t=${Date.now()}`;

    return this.http.get<GraphQLResponse<{ __typename: string }>>(url).pipe(
      timeout(timeoutMs),
      map((res) => !!res?.data?.__typename && !res?.errors?.length),
      catchError(() => of(false)),
    );
  }

  query<T = unknown, V extends GqlVariables = GqlVariables>(
    options: GqlOptions<V>,
  ): Observable<T> {
    return this.execute<T, V>(options);
  }

  mutate<T = unknown, V extends GqlVariables = GqlVariables>(
    options: GqlOptions<V>,
  ): Observable<T> {
    return this.execute<T, V>(options);
  }

  raw<T = unknown>(
    body: Record<string, unknown>,
    context?: {
      headers?: HttpHeaders | Record<string, string>;
      withCredentials?: boolean;
    },
  ): Observable<GraphQLResponse<T>> {
    const headers = this.buildHeaders(context?.headers);
    return this.http.post<GraphQLResponse<T>>(
      this.urls.GRAPHQL.ENDPOINT,
      body,
      {
        headers,
        withCredentials: context?.withCredentials ?? false,
      },
    );
  }

  private execute<T, V extends GqlVariables>(
    options: GqlOptions<V>,
  ): Observable<T> {
    const { query, variables, operationName, context } = options ?? {};
    const headers = this.buildHeaders(context?.headers);

    return this.http
      .post<
        GraphQLResponse<T>
      >(this.urls.GRAPHQL.ENDPOINT, { query, variables, operationName }, { headers, withCredentials: context?.withCredentials ?? false })
      .pipe(
        map((res) => {
          if (res.errors?.length) {
            const err = res.errors[0];
            // Importante: lanzar error (no return throwError) para que el tipo siga siendo T
            throw new Error(err?.message || 'GraphQL error');
          }
          if (!('data' in res) || typeof res.data === 'undefined') {
            throw new Error('Respuesta GraphQL vacía');
          }
          return res.data as T;
        }),
      );
  }

  private buildHeaders(
    custom?: HttpHeaders | Record<string, string>,
  ): HttpHeaders {
    let headers =
      custom instanceof HttpHeaders ? custom : new HttpHeaders(custom ?? {});

    // Aseguramos Accept/Content-Type para POST JSON
    if (!headers.has('Accept'))
      headers = headers.set('Accept', 'application/json');
    if (!headers.has('Content-Type'))
      headers = headers.set('Content-Type', 'application/json');

    return headers;
  }
}
