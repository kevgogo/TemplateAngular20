export const API_PATHS = {
  SECURITY: {
    LOGIN: '/Security/get-user-context',
    MENU: '/Security/get-menu',
    PERMISSION: '/Security/get-permission',
  },
  FARM: {
    GET: '/Farm/get-farm',
  },
  SYSTEM: {
    GET: '/System/get-system',
    SAVE: '/System/save-system',
    DELETE: '/System/delete-system',
    CANCEL: '/System/cancel-system',
    GET_ACTIVE: '/System/get-system-active',
  },
  VEHICLES: {
    GET: '/System/get-system',
    SAVE: '/System/save-system',
    DELETE: '/System/delete-system',
    CANCEL: '/System/cancel-system',
    GET_ACTIVE: '/System/get-system-active',
  },

  GRAPHQL: {
    ENDPOINT: '/graphql/',
    TOKEN: '/api/auth/token',
  },
} as const;
