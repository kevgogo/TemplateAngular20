import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import { SettingsService } from '@core/services/settings.service';

let _urls: ReturnType<typeof API_URLS> | null = null;

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

function getGraphqlTokenFromSettings(
  settings: SettingsService,
): string | undefined {
  const raw = settings.getUserSetting('tokenGraphQL');
  if (typeof raw === 'string') return raw;

  if (isObject(raw)) {
    const v = readStringProp(raw, 'value');
    if (v) return v;
  }

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

export const graphqlInterceptor: HttpInterceptorFn = (req, next) => {
  const urls = _urls ?? (_urls = API_URLS());
  if (!req.url.startsWith(urls.GRAPHQL.ENDPOINT)) {
    return next(req);
  }

  const isHealthPing =
    req.method === 'GET' && hasQueryParam(req.urlWithParams, 'hc', '1');
  if (isHealthPing) {
    return next(req);
  }

  if (req.headers.has('X-Skip-GraphQL-Auth')) {
    const clean = req.clone({
      headers: req.headers.delete('X-Skip-GraphQL-Auth'),
      withCredentials: false,
    });
    return next(clean);
  }

  // Resto: adjunta bearer si existe
  const settings = inject(SettingsService);
  const token = getGraphqlTokenFromSettings(settings);

  const finalReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(finalReq);
};
