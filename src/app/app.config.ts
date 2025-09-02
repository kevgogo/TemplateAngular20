import { APP_BASE_HREF } from '@angular/common';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { provideThirdParty } from '@shared/app-third-party.providers';
import { routes } from './app.routes';

import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { graphqlInterceptor } from '@core/interceptors/graphql-interceptor';

import { API_BASE_URL, APP_BASE_HREF_TOKEN } from '@core/tokens/app-tokens';
import { environment } from '@environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),

    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, graphqlInterceptor]),
    ),

    provideAnimations(),
    provideThirdParty(),

    // Base href desde token
    { provide: APP_BASE_HREF, useExisting: APP_BASE_HREF_TOKEN },

    provideAppInitializer(() => {
      if (!environment.production) return;
      const base = inject(API_BASE_URL);
      if (!base || base === '/' || base === '') {
        console.error('[Config] API_BASE_URL vacío en producción');
      }
    }),
  ],
};
