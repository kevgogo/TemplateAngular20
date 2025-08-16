// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { provideThirdParty } from '@shared/app-third-party.providers';
import { APP_BASE_HREF_TOKEN } from '@core/tokens/app-tokens';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    // 👇 importante para DI-based interceptors
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    provideAnimations(),
    provideThirdParty(),

    { provide: APP_BASE_HREF, useExisting: APP_BASE_HREF_TOKEN },
  ],
};
