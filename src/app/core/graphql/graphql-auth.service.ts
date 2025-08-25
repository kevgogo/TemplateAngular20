import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import {
  catchError,
  map,
  Observable,
  retryWhen,
  timer,
  throwError,
} from 'rxjs';
import { mergeMap } from 'rxjs/operators';

interface GraphQLError {
  message: string;
}
interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

function backoff503(maxRetries = 3, initialMs = 500) {
  return <T>(src: Observable<T>) =>
    src.pipe(
      retryWhen((errors) =>
        errors.pipe(
          mergeMap((err, i) => {
            const is503 =
              err instanceof HttpErrorResponse && err.status === 503;
            if (is503 && i < maxRetries) {
              const delay =
                initialMs * Math.pow(2, i) + Math.floor(Math.random() * 150);
              return timer(delay);
            }
            return throwError(() => err);
          })
        )
      )
    );
}

@Injectable({ providedIn: 'root' })
export class GraphQLAuthService {
  private urls = API_URLS();
  constructor(private http: HttpClient) {}

  /** Obtiene el token via mutación GetToken */
  getGraphQLToken(username?: string, password?: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Cache-Control': 'no-store',
      'X-Skip-GraphQL-Auth': '1', // <- CRÍTICO: el interceptor no inyecta Authorization
    });

    const query = `
      mutation GetToken($input: AuthInput!) {
        auth(input: $input) { accessToken expiresIn refreshToken }
      }
    `;
    const variables = { input: { username, password } };

    return this.http
      .post<
        GraphQLResponse<{
          auth: {
            accessToken: string;
            expiresIn: number;
            refreshToken?: string;
          };
        }>
      >(
        this.urls.GRAPHQL.ENDPOINT,
        { query, variables, operationName: 'GetToken' },
        { headers, withCredentials: false } // evita cookies en el LB/WAF
      )
      .pipe(
        backoff503(3, 600),
        map((res) => {
          if (res.errors?.length) throw res.errors[0];
          const token = res.data?.auth.accessToken;
          if (!token) throw new Error('Token vacío');
          return token;
        }),
        catchError((err) => {
          // Log útil para distinguir CORS vs. 503 real vs. DNS
          if (err instanceof HttpErrorResponse) {
            console.error(
              '[GraphQLAuth] status:',
              err.status,
              'url:',
              err.url,
              'body:',
              err.error
            );
          } else {
            console.error('[GraphQLAuth] error:', err);
          }
          return throwError(() => err);
        })
      );
  }
}
