// src/app/core/constants/api-urls.ts
import { inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/app-tokens';
import { API_PATHS } from './api-paths';

const join = (base: string, path: string) =>
  `${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : '/' + path}`;

export function API_URLS(BASE = inject(API_BASE_URL)) {
  const B = BASE || '';
  return {
    SECURITY: {
      LOGIN: join(B, API_PATHS.SECURITY.LOGIN),
      MENU: join(B, API_PATHS.SECURITY.MENU),
      PERMISSION: join(B, API_PATHS.SECURITY.PERMISSION),
    },
    FARM: {
      GET: join(B, API_PATHS.FARM.GET),
    },
    SYSTEM: {
      GET: join(B, API_PATHS.SYSTEM.GET),
      SAVE: join(B, API_PATHS.SYSTEM.SAVE),
      DELETE: join(B, API_PATHS.SYSTEM.DELETE),
      CANCEL: join(B, API_PATHS.SYSTEM.CANCEL),
      GET_ACTIVE: join(B, API_PATHS.SYSTEM.GET_ACTIVE),
    },
  } as const;
}
