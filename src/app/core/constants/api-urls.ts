import { inject } from '@angular/core';
import {
  API_BASE_URL,
  GRAPHQL_AUTH_BASE_URL,
  GRAPHQL_BASE_URL,
} from '@core/tokens/app-tokens';
import { API_PATHS } from './api-paths';

const join = (base: string, path: string) =>
  `${(base || '').replace(/\/+$/, '')}/${(path || '').replace(/^\/+/, '')}`;

const ensureTrailingSlash = (url: string) =>
  url.endsWith('/') ? url : url + '/';

export function API_URLS(
  REST_BASE = inject(API_BASE_URL),
  GQL_BASE = inject(GRAPHQL_BASE_URL),
  GQL_AUTH_BASE = inject(GRAPHQL_AUTH_BASE_URL),
) {
  const B = REST_BASE || '';
  const G = GQL_BASE || B;
  const GA = GQL_AUTH_BASE || G;

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

    VEHICLES: {
      GET: join(B, API_PATHS.VEHICLES.GET),
      SAVE: join(B, API_PATHS.VEHICLES.SAVE),
      DELETE: join(B, API_PATHS.VEHICLES.DELETE),
      CANCEL: join(B, API_PATHS.VEHICLES.CANCEL),
      GET_ACTIVE: join(B, API_PATHS.VEHICLES.GET_ACTIVE),
    },

    GRAPHQL: {
      ENDPOINT: ensureTrailingSlash(join(G, API_PATHS.GRAPHQL.ENDPOINT)),
      TOKEN: join(GA, API_PATHS.GRAPHQL.TOKEN),
    },
  } as const;
}
