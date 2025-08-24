import { InjectionToken } from '@angular/core';
import { environment } from '@environments/environment';

export const APP_NAME_TOKEN = new InjectionToken<string>('APP_NAME', {
  providedIn: 'root',
  factory: () => {
    // TODO: Cambiar nombre de la aplicación
    return 'Plantilla Angular 20';
  },
});

export const APP_DESCRIPTION_TOKEN = new InjectionToken<string>(
  'APP_DESCRIPTION',
  {
    providedIn: 'root',
    factory: () => {
      // TODO: Cambiar descripción de la aplicación
      return 'Descripción de la APP';
    },
  }
);

export const APP_BASE_HREF_TOKEN = new InjectionToken<string>('APP_BASE_HREF', {
  providedIn: 'root',
  factory: () => {
    // TODO: Cambiar nombre del base href, si lo cambias, modifica también el valor del baseref en index.html
    return '/plantilla-colibri-app-20';
  },
});

export const APP_VERSION_TOKEN = new InjectionToken<string>('APP_VERSION', {
  providedIn: 'root',
  factory: () => {
    return '1.0.0'; // Versión de la aplicación
  },
});

export const APP_AUTHOR_TOKEN = new InjectionToken<string>('APP_AUTHOR', {
  providedIn: 'root',
  factory: () => {
    return 'Sunshine Bouquet Ⓒ'; // Autor de la aplicación
  },
});

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.urlApiBase, // p.ej. https://api.miapp.com
});

export const APP_LAND_ID = new InjectionToken<string>('APP_LAND_ID', {
  providedIn: 'root',
  factory: () => environment.land_id,
});

export const APP_MODULE_ID = new InjectionToken<string>('APP_MODULE_ID', {
  providedIn: 'root',
  factory: () => environment.module_id,
});

export const APP_URL_COLIBRI = new InjectionToken<string>('APP_URL_COLIBRI', {
  providedIn: 'root',
  factory: () => environment.urlColibri,
});

export const GRAPHQL_BASE_URL = new InjectionToken<string>('GRAPHQL_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.urlApiGraphQL,
});

export const GRAPHQL_AUTH_BASE_URL = new InjectionToken<string>(
  'GRAPHQL_AUTH_BASE_URL',
  {
    providedIn: 'root',
    factory: () => environment.urlAuthApiGraphQL,
  }
);

export const GRAPHQL_USER_TOKEN = new InjectionToken<string>(
  'GRAPHQL_USER_TOKEN',
  {
    providedIn: 'root',
    factory: () => environment.user_graphql_api,
  }
);

export const GRAPHQL_PASSWORD_TOKEN = new InjectionToken<string>(
  'GRAPHQL_PASSWORD_TOKEN',
  {
    providedIn: 'root',
    factory: () => environment.password_graphql_api,
  }
);
