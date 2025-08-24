// src/app/core/constants/api-urls.ts
import { inject } from '@angular/core';
import {
  API_BASE_URL,
  GRAPHQL_BASE_URL,
  GRAPHQL_AUTH_BASE_URL,
} from '@core/tokens/app-tokens';
import { API_PATHS } from './api-paths';

// Junta base + path con tolerancia de slashes
const join = (base: string, path: string) =>
  `${(base || '').replace(/\/+$/, '')}/${(path || '').replace(/^\/+/, '')}`;

// Garantiza / al final (para /graphql/)
const ensureTrailingSlash = (url: string) =>
  url.endsWith('/') ? url : url + '/';

export function API_URLS(
  REST_BASE = inject(API_BASE_URL),
  GQL_BASE = inject(GRAPHQL_BASE_URL),
  GQL_AUTH_BASE = inject(GRAPHQL_AUTH_BASE_URL)
) {
  const B = REST_BASE || '';
  const G = GQL_BASE || B;
  const GA = GQL_AUTH_BASE || G;

  return {
    // ======== TUS RUTAS EXISTENTES ========
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

    // ======== GRAPHQL ========
    GRAPHQL: {
      // host de GraphQL (puede ser otro dominio)
      ENDPOINT: ensureTrailingSlash(join(G, API_PATHS.GRAPHQL.ENDPOINT)), // → .../graphql/
      TOKEN: join(GA, API_PATHS.GRAPHQL.TOKEN), // → .../api/auth/token
    },
  } as const;
}
