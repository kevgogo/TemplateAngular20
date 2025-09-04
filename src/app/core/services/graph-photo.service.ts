// graph-photo.service.ts
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { readColibriTokenBy } from '@core/utils/colibri-auth.util';
import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

export type GraphPhotoSize =
  | '48x48'
  | '64x64'
  | '96x96'
  | '120x120'
  | '240x240'
  | '360x360'
  | '432x432'
  | '504x504'
  | '648x648';

export interface UserPhotoConfig {
  defaultPhotoUrl?: string;
  cacheEnabled?: boolean;
  cacheDurationMs?: number;
}

interface PhotoCache {
  photoUrl: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class GraphPhotoService {
  private readonly graphBase = 'https://graph.microsoft.com/v1.0';
  private readonly cache = new Map<string, PhotoCache>();
  private readonly http = inject(HttpClient);

  getPhotoDataUrlWithToken$(
    token: string,
    size: GraphPhotoSize = '120x120',
    config?: UserPhotoConfig,
  ): Observable<string | null> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'image/*',
    });
    return this.fetchPhoto$(headers, size, config);
  }

  async getPhotoDataUrlWithToken(
    token: string,
    size: GraphPhotoSize = '120x120',
    config?: UserPhotoConfig,
  ): Promise<string | null> {
    return firstValueFrom(this.getPhotoDataUrlWithToken$(token, size, config));
  }

  getPhotoDataUrlFromStorage$(
    propPath = 'token',
    size: GraphPhotoSize = '120x120',
    config?: UserPhotoConfig,
  ): Observable<string | null> {
    const token = readColibriTokenBy(propPath);
    if (!token) return of(config?.defaultPhotoUrl ?? null);
    return this.getPhotoDataUrlWithToken$(token, size, config);
  }

  getPhotoDataUrl$(
    size: GraphPhotoSize = '120x120',
    config?: UserPhotoConfig,
  ): Observable<string | null> {
    const headers = new HttpHeaders({ Accept: 'image/*' }); // el interceptor pondrá Authorization
    return this.fetchPhoto$(headers, size, config);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ---- Internos ----
  private fetchPhoto$(
    headers: HttpHeaders,
    size: GraphPhotoSize,
    config?: UserPhotoConfig,
  ): Observable<string | null> {
    const ttl = config?.cacheDurationMs ?? 5 * 60 * 1000;
    const useCache = config?.cacheEnabled ?? true;
    const cacheKey = size;

    if (useCache) {
      const hit = this.cache.get(cacheKey);
      if (hit && Date.now() - hit.timestamp < ttl) return of(hit.photoUrl);
    }

    const sizeUrl = `${this.graphBase}/me/photos/${size}/$value`;
    const fullUrl = `${this.graphBase}/me/photo/$value`;

    // 👇 cast 'blob' as 'json' + genérico <Blob> para forzar el overload correcto
    return this.http
      .get<Blob>(sizeUrl, {
        headers,
        responseType: 'blob' as 'json',
      })
      .pipe(
        switchMap((blob) => this.blobToDataUrl$(blob)),

        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return this.http
              .get<Blob>(fullUrl, {
                headers,
                responseType: 'blob' as 'json',
              })
              .pipe(
                switchMap((blob) => this.blobToDataUrl$(blob)),
                catchError(() => of<string | null>(null)),
              );
          }
          return of<string | null>(null);
        }),

        map((dataUrl) => dataUrl ?? config?.defaultPhotoUrl ?? null),
        tap((finalUrl) => {
          if ((config?.cacheEnabled ?? true) && finalUrl) {
            this.cache.set(cacheKey, {
              photoUrl: finalUrl,
              timestamp: Date.now(),
            });
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
  }

  private blobToDataUrl$(blob: Blob): Observable<string> {
    return new Observable<string>((observer) => {
      const reader = new FileReader();
      reader.onerror = (e) => observer.error(e);
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.readAsDataURL(blob);
    });
  }
}
