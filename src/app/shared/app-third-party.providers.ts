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
  ]);
}
