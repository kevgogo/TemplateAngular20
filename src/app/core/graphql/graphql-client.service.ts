import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import { map, throwError } from 'rxjs';

export interface GraphQLError {
  message: string;
  path?: (string | number)[];
  extensions?: any;
}
export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

@Injectable({ providedIn: 'root' })
export class GraphQLClientService {
  private urls = API_URLS();

  constructor(private http: HttpClient) {}

  execute<TData, TVars = Record<string, any>>(
    query: string,
    variables?: TVars
  ) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http
      .post<GraphQLResponse<TData>>(
        this.urls.GRAPHQL.ENDPOINT,
        { query, variables },
        { headers }
      )
      .pipe(
        map((res) => {
          if (res?.errors?.length) {
            const msg = res.errors.map((e) => e.message).join(' | ');
            throw throwError(() => new Error(msg));
          }
          return res.data as TData;
        })
      );
  }
}
