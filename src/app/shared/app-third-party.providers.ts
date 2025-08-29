// src/app/shared/app-third-party.providers.ts
import {
  EnvironmentProviders,
  importProvidersFrom,
  makeEnvironmentProviders,
} from '@angular/core';
import { BsDropdownConfig, BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule, ModalOptions } from 'ngx-bootstrap/modal';
import { TooltipConfig, TooltipModule } from 'ngx-bootstrap/tooltip';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { provideSweetAlert2 } from '@sweetalert2/ngx-sweetalert2';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export function provideThirdParty(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Requerido por ngx-toastr
    provideAnimations(),

    importProvidersFrom(
      BsDropdownModule.forRoot(),
      CollapseModule.forRoot(),
      ModalModule.forRoot(),
      TooltipModule.forRoot(),
      PopoverModule.forRoot(),
      ToastrModule.forRoot({
        timeOut: 4000,
        positionClass: 'toast-bottom-right',
        preventDuplicates: true,
      })
    ),

    {
      provide: BsDropdownConfig,
      useValue: { container: 'body', autoClose: true, isAnimated: true },
    },
    {
      provide: TooltipConfig,
      useValue: { container: 'body', adaptivePosition: true },
    },
    // Opcional: modal centrado por defecto
    {
      provide: ModalOptions,
      useValue: { class: 'modal-dialog-centered', animated: true },
    },

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

    // Config opcional para SweetAlert2
    provideSweetAlert2({
      fireOnInit: false,
      dismissOnDestroy: true,
    }),
  ]);
}
