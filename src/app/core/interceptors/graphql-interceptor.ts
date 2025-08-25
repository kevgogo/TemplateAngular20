import { HttpInterceptorFn } from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import { inject } from '@angular/core';
import { SettingsService } from '@core/services/settings.service';

let _urls: ReturnType<typeof API_URLS> | null = null;

// util: ¿la URL trae ?hc=1 ?
function hasQueryParam(url: string, name: string, value?: string) {
  const v = value != null ? `=${value}` : '(=|&|$)';
  const re = new RegExp(`[?&]${name}${v}`);
  return re.test(url);
}

export const graphqlInterceptor: HttpInterceptorFn = (req, next) => {
  const urls = _urls ?? (_urls = API_URLS());
  if (!req.url.startsWith(urls.GRAPHQL.ENDPOINT)) return next(req);

  // 🔒 No tocar los pings GET con ?hc=1 (sin Authorization, sin headers extra)
  const isHealthPing =
    req.method === 'GET' && hasQueryParam(req.urlWithParams, 'hc', '1');
  if (isHealthPing) {
    return next(req); // pasa tal cual, sin Authorization
  }

  // Permite saltar auth por header en otros casos (ej: mutación de token)
  if (req.headers.has('X-Skip-GraphQL-Auth')) {
    const clean = req.clone({
      headers: req.headers.delete('X-Skip-GraphQL-Auth'),
      withCredentials: false,
    });
    return next(clean);
  }

  // Resto: adjunta bearer si existe
  const token = inject(SettingsService).getUserSetting('tokenGraphQL');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
