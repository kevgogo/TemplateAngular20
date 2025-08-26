import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { SettingsService } from '@core/services/settings.service';
import { CommonService } from '@core/services/common.service';
import { catchError, throwError } from 'rxjs';

// --- helpers añadidos ---
function hasQueryParam(url: string, name: string, value?: string) {
  const v = value != null ? `=${value}` : '(=|&|$)';
  const re = new RegExp(`[?&]${name}${v}`);
  return re.test(url);
}
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function isTokenMutationBody(body: unknown): boolean {
  if (!isObject(body)) return false;
  const op = (body as any).operationName;
  if (typeof op === 'string' && op === 'GetToken') return true;
  const q = (body as any).query;
  return typeof q === 'string' && /\bmutation\s+GetToken\b/.test(q);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const settings = inject(SettingsService);
  const common = inject(CommonService);

  // --- NUEVO: detectar pings/skip/token ---
  const isHealthPing =
    req.method === 'GET' && hasQueryParam(req.urlWithParams, 'hc', '1');
  const hasSkipHeader =
    req.headers.has('X-Skip-Auth') || req.headers.has('X-Skip-GraphQL-Auth');
  const isGraphQL = /\/graphql(\?|$)/.test(req.url);
  const isTokenMutation =
    isGraphQL && req.method === 'POST' && isTokenMutationBody(req.body);

  // --- NUEVO: no inyectar Authorization en estos casos ---
  let finalReq = req;
  if (isHealthPing || hasSkipHeader || isTokenMutation) {
    finalReq = req.clone({
      headers: req.headers.delete('X-Skip-Auth').delete('X-Skip-GraphQL-Auth'),
      withCredentials: false, // evita cookies que algunos LB/WAF bloquean
    });
  } else {
    const token: string | undefined = settings.getUserSetting('token');
    finalReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  }

  return next(finalReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // --- NUEVO: no redirigir si fue ping/skip/token ---
      if (isHealthPing || hasSkipHeader || isTokenMutation) {
        return throwError(() => err);
      }

      const is5xx = err.status >= 500 && err.status < 600;
      console.table(err);

      if (err.status === 401) {
        common.redirecToUnauthorized({
          code: '401',
          error: 'No autorizado',
          message: 'Su token ha caducado o no es válido',
        });
      } else if (err.status === 403) {
        common.redirecToError({
          code: '403',
          error: 'Acceso denegado',
          message: 'No tienes permisos para acceder a este recurso',
        });
      } else if (err.status === 400) {
        common.redirecToError({
          code: '400',
          error: 'Credenciales',
          message: 'Credenciales vencidas, vuelva a hacer login',
        });
      } else if (err.status === 503 || err.status === 0) {
        if (!err.url) {
          common.redirecToError({
            code: '503',
            error: 'Error',
            message: 'Servicio no disponible',
          });
        }
      } else if (is5xx && err.status !== 503) {
        common.redirecToError({
          code: String(err.status || '500'),
          error: 'Error del servidor',
          message: 'Ocurrió un error interno al procesar su solicitud',
        });
      }

      return throwError(() => err);
    })
  );
};
