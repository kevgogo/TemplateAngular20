import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AlertComponent } from '@shared/components/alert/alert.component';
import { ChronoComponent } from '@shared/components/chrono/chrono.component';
import { ProgressbarComponent } from '@shared/components/progressbar/progressbar.component';

import {
  SwalComponent,
  SwalDirective,
  SwalPortalDirective,
} from '@sweetalert2/ngx-sweetalert2';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

export { AlertComponent } from '@shared/components/alert/alert.component';
export { ChronoComponent } from '@shared/components/chrono/chrono.component';
export { ProgressbarComponent } from '@shared/components/progressbar/progressbar.component';

// Exportamos externos
export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  BsDropdownModule,

  ChronoComponent,
  AlertComponent,
  ProgressbarComponent,
  AlertComponent,

  SwalComponent,
  SwalDirective,
  SwalPortalDirective,
];
