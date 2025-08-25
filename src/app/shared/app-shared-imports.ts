// src/app/shared/app-shared-imports.ts
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
// import { DialogsHostComponent } from './components/dialogs/dialogs-host.component';

export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  BsDropdownModule,
  // DialogsHostComponent,
];
