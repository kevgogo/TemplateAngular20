import { ApplicationConfig } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideThirdParty } from '@shared/app-third-party.providers';
import { APP_BASE_HREF } from '@angular/common';
import { APP_BASE_HREF_TOKEN } from '@core/tokens/app-tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideThirdParty(),
    // Proporciona el APP_BASE_HREF para la aplicación
    { provide: APP_BASE_HREF, useExisting: APP_BASE_HREF_TOKEN },
  ],
};
