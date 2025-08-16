// src/app/app.config.ts
import {
  ApplicationConfig,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';

import { routes } from './app.routes';
import { provideThirdParty } from '@shared/app-third-party.providers';

import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { API_BASE_URL } from '@core/tokens/app-tokens';
import { APP_BASE_HREF_TOKEN } from '@core/tokens/app-tokens';
import { environment } from '@environments/environment';

// (Opcional) si vas a hacer health-check async
// import { firstValueFrom } from 'rxjs';
// import { SystemService } from '@core/services/system.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),

    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    provideAnimations(),
    provideThirdParty(),

    // Base href desde token
    { provide: APP_BASE_HREF, useExisting: APP_BASE_HREF_TOKEN },

    // Initializer SÍNCRONO: validar configuración en producción
    provideAppInitializer(() => {
      if (!environment.production) return;
      const base = inject(API_BASE_URL);
      if (!base || base === '/' || base === '') {
        console.error('[Config] API_BASE_URL vacío en producción');
      }
    }),

    // Initializer ASÍNCRONO: esperar health-check antes de arrancar
    // provideAppInitializer(() =>
    //   firstValueFrom(inject(SystemService).health())
    // ),
  ],
};
