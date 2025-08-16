// src/app/core/constants/api-urls.ts
import { inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/app-tokens';
import { API_PATHS } from './api-paths';

export function API_URLS(BASE = inject(API_BASE_URL)) {
  return {
    SECURITY: {
      LOGIN: BASE + API_PATHS.SECURITY.LOGIN,
      MENU: BASE + API_PATHS.SECURITY.MENU,
      PERMISSION: BASE + API_PATHS.SECURITY.PERMISSION,
    },
    FARM: {
      GET: BASE + API_PATHS.FARM.GET,
    },
    SYSTEM: {
      GET: BASE + API_PATHS.SYSTEM.GET,
      SAVE: BASE + API_PATHS.SYSTEM.SAVE,
      DELETE: BASE + API_PATHS.SYSTEM.DELETE,
      CANCEL: BASE + API_PATHS.SYSTEM.CANCEL,
      GET_ACTIVE: BASE + API_PATHS.SYSTEM.GET_ACTIVE,
    },
  } as const;
}
