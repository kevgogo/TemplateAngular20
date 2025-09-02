import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CommonService } from '@core/services/common.service';
import { SettingsService } from '@core/services/settings.service';
import { catchError, throwError } from 'rxjs';

function hasQueryParam(url: string, name: string, value?: string): boolean {
  const v = value != null ? `=${value}` : '(=|&|$)';
  const re = new RegExp(`[?&]${name}${v}`);
  return re.test(url);
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function readStringProp(obj: unknown, key: string): string | undefined {
  if (!isObject(obj)) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function isTokenMutationBody(body: unknown): boolean {
  const op = readStringProp(body, 'operationName');
  if (op === 'GetToken') return true;

  const q = readStringProp(body, 'query');
  return typeof q === 'string' && /\bmutation\s+GetToken\b/.test(q);
}

function getTokenFromSettings(settings: SettingsService): string | undefined {
  const tkRaw = settings.getUserSetting('token');
  if (typeof tkRaw === 'string') return tkRaw;

  if (isObject(tkRaw)) {
    const v = readStringProp(tkRaw, 'value');
    if (v) return v;
  }

  const usr = settings.getUserSetting();
  if (isObject(usr)) {
    const t1 = readStringProp(usr, 'token');
    if (t1) return t1;
    const t2 = readStringProp(usr, 'Token');
    if (t2) return t2;
  }

  return undefined;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const settings = inject(SettingsService);
  const common = inject(CommonService);

  const isHealthPing =
    req.method === 'GET' && hasQueryParam(req.urlWithParams, 'hc', '1');
  const hasSkipHeader =
    req.headers.has('X-Skip-Auth') || req.headers.has('X-Skip-GraphQL-Auth');
  const isGraphQL = /\/graphql(\?|$)/.test(req.url);
  const isTokenMutation =
    isGraphQL && req.method === 'POST' && isTokenMutationBody(req.body);

  let finalReq = req;
  if (isHealthPing || hasSkipHeader || isTokenMutation) {
    finalReq = req.clone({
      headers: req.headers.delete('X-Skip-Auth').delete('X-Skip-GraphQL-Auth'),
      withCredentials: false,
    });
  } else {
    const token = getTokenFromSettings(settings);
    finalReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  }

  return next(finalReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isHealthPing || hasSkipHeader || isTokenMutation) {
        return throwError(() => err);
      }

      const is5xx = err.status >= 500 && err.status < 600;

      if (err.status === 401) {
        void common.redirecToUnauthorized({
          code: '401',
          error: 'No autorizado',
          message: 'Su token ha caducado o no es válido',
        });
      } else if (err.status === 403) {
        void common.redirecToError({
          code: '403',
          error: 'Acceso denegado',
          message: 'No tienes permisos para acceder a este recurso',
        });
      } else if (err.status === 400) {
        void common.redirecToError({
          code: '400',
          error: 'Credenciales',
          message: 'Credenciales vencidas, vuelva a hacer login',
        });
      } else if (err.status === 503 || err.status === 0) {
        if (!err.url) {
          void common.redirecToError({
            code: '503',
            error: 'Error',
            message: 'Servicio no disponible',
          });
        }
      } else if (is5xx && err.status !== 503) {
        void common.redirecToError({
          code: String(err.status || '500'),
          error: 'Error del servidor',
          message: 'Ocurrió un error interno al procesar su solicitud',
        });
      }

      return throwError(() => err);
    }),
  );
};
