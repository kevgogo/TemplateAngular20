// src/app/core/graphql/graphql-client.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

/** Tipos base para respuestas GraphQL */
export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export type GqlVariables = Record<string, unknown> | undefined;

export interface GqlOptions<V extends GqlVariables = GqlVariables> {
  /** String del query/mutation GraphQL */
  query: string;
  /** Variables del query/mutation */
  variables?: V;
  /** operationName explícito si tu servidor lo requiere */
  operationName?: string;
  /** Contexto opcional para cabeceras o withCredentials */
  context?: {
    headers?: HttpHeaders | Record<string, string>;
    withCredentials?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class GraphQLClientService {
  private readonly urls = API_URLS();

  constructor(private http: HttpClient) {}

  /**
   * Health-check ultra barato por GET sin headers "no simples".
   * - Usa ?hc=1 para que el interceptor NO inyecte Authorization.
   * - Evita preflight/OPTIONS y las reglas del WAF/LB que devuelven 503.
   */
  isAlive(timeoutMs = 1200): Observable<boolean> {
    const q = encodeURIComponent('{ __typename }');
    const url = `${this.urls.GRAPHQL.ENDPOINT}?hc=1&query=${q}&t=${Date.now()}`;

    return this.http.get<GraphQLResponse<{ __typename: string }>>(url).pipe(
      timeout(timeoutMs),
      map((res) => !!res?.data?.__typename && !res?.errors?.length),
      catchError(() => of(false))
    );
  }

  /**
   * Ejecuta un query GraphQL (POST).
   * Nota: el interceptor añadirá Authorization si hay token almacenado.
   */
  query<T = unknown, V extends GqlVariables = GqlVariables>(
    options: GqlOptions<V>
  ): Observable<T> {
    return this.execute<T, V>(options);
  }

  /**
   * Ejecuta una mutation GraphQL (POST).
   * Igual que query, lo separamos por semántica.
   */
  mutate<T = unknown, V extends GqlVariables = GqlVariables>(
    options: GqlOptions<V>
  ): Observable<T> {
    return this.execute<T, V>(options);
  }

  /**
   * Low-level: permite enviar un body arbitrario al endpoint /graphql.
   * Útil si necesitas pasar extensiones personalizadas del servidor.
   */
  raw<T = unknown>(
    body: Record<string, unknown>,
    context?: {
      headers?: HttpHeaders | Record<string, string>;
      withCredentials?: boolean;
    }
  ): Observable<GraphQLResponse<T>> {
    const headers = this.buildHeaders(context?.headers);
    return this.http.post<GraphQLResponse<T>>(
      this.urls.GRAPHQL.ENDPOINT,
      body,
      {
        headers,
        withCredentials: context?.withCredentials ?? false,
      }
    );
  }

  // -------------------- privados --------------------

  private execute<T, V extends GqlVariables>(
    options: GqlOptions<V>
  ): Observable<T> {
    const { query, variables, operationName, context } = options ?? {};
    const headers = this.buildHeaders(context?.headers);

    return this.http
      .post<GraphQLResponse<T>>(
        this.urls.GRAPHQL.ENDPOINT,
        { query, variables, operationName },
        { headers, withCredentials: context?.withCredentials ?? false }
      )
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
        catchError((err) => throwError(() => err))
      );
  }

  private buildHeaders(
    custom?: HttpHeaders | Record<string, string>
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
