// src/app/core/interceptors/graphql.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import { SettingsService } from '@core/services/settings.service';

/* ===================== Helpers ===================== */

let _urls: ReturnType<typeof API_URLS> | null = null;

/** ¿la URL trae ?{name}={value}?  (si value no se pasa, valida presencia del nombre) */
function hasQueryParam(url: string, name: string, value?: string): boolean {
  const v = value != null ? `=${value}` : '(=|&|$)';
  const re = new RegExp(`[?&]${name}${v}`);
  return re.test(url);
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** Lee una propiedad string de forma segura */
function readStringProp(obj: unknown, key: string): string | undefined {
  if (!isObject(obj)) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

/** Obtiene el token de GraphQL desde SettingsService de forma segura */
function getGraphqlTokenFromSettings(
  settings: SettingsService,
): string | undefined {
  // 1) Preferencia: tokenGraphQL guardado como string
  const raw = settings.getUserSetting('tokenGraphQL');
  if (typeof raw === 'string') return raw;

  // 2) A veces lo guardan como objeto { value: '...' }
  if (isObject(raw)) {
    const v = readStringProp(raw, 'value');
    if (v) return v;
  }

  // 3) Fallback (opcional): usar "token" del usuario/ajuste si no hay tokenGraphQL
  const usr = settings.getUserSetting();
  if (isObject(usr)) {
    const t1 = readStringProp(usr, 'token');
    if (t1) return t1;
    const t2 = readStringProp(usr, 'Token');
    if (t2) return t2;
  }
  const tk = settings.getUserSetting('token');
  if (typeof tk === 'string') return tk;
  if (isObject(tk)) {
    const v = readStringProp(tk, 'value');
    if (v) return v;
  }
  return undefined;
}

/* ===================== Interceptor ===================== */

export const graphqlInterceptor: HttpInterceptorFn = (req, next) => {
  const urls = _urls ?? (_urls = API_URLS());
  // Si no es el endpoint GraphQL, no tocamos la request
  if (!req.url.startsWith(urls.GRAPHQL.ENDPOINT)) {
    return next(req);
  }

  // 🔒 No tocar los pings GET con ?hc=1 (sin Authorization, sin headers extra)
  const isHealthPing =
    req.method === 'GET' && hasQueryParam(req.urlWithParams, 'hc', '1');
  if (isHealthPing) {
    return next(req); // pasa tal cual
  }

  // Permite saltar auth por header (ej: mutación para obtener token)
  if (req.headers.has('X-Skip-GraphQL-Auth')) {
    const clean = req.clone({
      headers: req.headers.delete('X-Skip-GraphQL-Auth'),
      withCredentials: false, // evita enviar cookies innecesarias
    });
    return next(clean);
  }

  // Resto: adjunta bearer si existe
  const settings = inject(SettingsService);
  const token = getGraphqlTokenFromSettings(settings); // string | undefined

  const finalReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(finalReq);
};
