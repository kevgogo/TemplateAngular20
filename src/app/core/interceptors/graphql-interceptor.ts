import { HttpInterceptorFn } from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import { inject } from '@angular/core';
import { SettingsService } from '@core/services/settings.service';

let _urls: ReturnType<typeof API_URLS> | null = null;

export const graphqlInterceptor: HttpInterceptorFn = (req, next) => {
  const urls = _urls ?? (_urls = API_URLS());
  if (!req.url.startsWith(urls.GRAPHQL.ENDPOINT)) return next(req);

  const token = inject(SettingsService).getUserSetting('tokenGraphQL');
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })
    : req;

  return next(authReq);
};
