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
