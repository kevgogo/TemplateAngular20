// src/app/shared/app-shared-imports.ts
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ChronoComponent } from './components/chrono/chrono.component';
import { AlertComponent } from './components/alert/alert.component';
import { BsIconDirective } from '@shared/directives/bs-icon.directive';
import { FaIconDirective } from './directives/fa-icon.directive';

export { AlertComponent } from './components/alert/alert.component';
export { ChronoComponent } from './components/chrono/chrono.component';
export { BsIconDirective } from '@shared/directives/bs-icon.directive';
export { FaIconDirective } from './directives/fa-icon.directive';

export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  BsDropdownModule,
  // DialogsHostComponent,
  ChronoComponent,
  AlertComponent,
  BsIconDirective,
  FaIconDirective,
];
