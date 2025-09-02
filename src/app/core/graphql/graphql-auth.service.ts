import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import {
  catchError,
  map,
  Observable,
  retryWhen,
  throwError,
  timer,
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
            return throwError(() => {
              const error: Error = new Error(`This is an error`);
              return error;
            });
          }),
        ),
      ),
    );
}

@Injectable({ providedIn: 'root' })
export class GraphQLAuthService {
  private urls = API_URLS();
  private http = inject(HttpClient);

  getGraphQLToken(username?: string, password?: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Cache-Control': 'no-store',
      'X-Skip-GraphQL-Auth': '1',
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
        { headers, withCredentials: false },
      )
      .pipe(
        backoff503(3, 600),
        map((res) => {
          if (res.errors?.length) throw Error(res.errors[0].message);
          const token = res.data?.auth.accessToken;
          if (!token) throw new Error('Token vacío');
          return token;
        }),
        catchError((err) => {
          if (err instanceof HttpErrorResponse) {
            console.error(
              '[GraphQLAuth] status:',
              err.status,
              'url:',
              err.url,
              'body:',
              err.error,
            );
          } else {
            console.error('[GraphQLAuth] error:', err);
          }
          return throwError(() => {
            const error: Error = new Error(`This is an error: ${err}`);
            return error;
          });
        }),
      );
  }
}
