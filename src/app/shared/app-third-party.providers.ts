// src/app/shared/app-third-party.providers.ts
import {
  EnvironmentProviders,
  importProvidersFrom,
  makeEnvironmentProviders,
} from '@angular/core';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ToastrModule } from 'ngx-toastr';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export function provideThirdParty(): EnvironmentProviders {
  return makeEnvironmentProviders([
    importProvidersFrom(
      BsDropdownModule.forRoot(),
      CollapseModule.forRoot(),
      ModalModule.forRoot(),
      TooltipModule.forRoot(),
      PopoverModule.forRoot(),
      ToastrModule.forRoot({
        positionClass: 'toast-bottom-right',
        timeOut: 2500,
      })
    ),
    provideTranslateService({
      fallbackLang: 'es_AR',
      // Loader HTTP (prefijo/sufijo según tu estructura)
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
        // Opcionales:
        // enforceLoading: true,  // cache-busting
        // useHttpBackend: true,  // evita interceptores
      }),
    }),
  ]);
}
