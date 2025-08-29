// Angular
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

// Componentes dentro de @Shared
import { ChronoComponent } from '@shared/components/chrono/chrono.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ProgressbarComponent } from '@shared/components/progressbar/progressbar.component';

// @Externos de node_modules
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import {
  SwalComponent,
  SwalDirective,
  SwalPortalDirective,
} from '@sweetalert2/ngx-sweetalert2';

// Exportamos externos

// Exportamos los creados dentro de @Shared
export { AlertComponent } from '@shared/components/alert/alert.component';
export { ChronoComponent } from '@shared/components/chrono/chrono.component';
export { ProgressbarComponent } from '@shared/components/progressbar/progressbar.component';

// Exportamos externos
export const SHARED_IMPORTS = [
  // Angular
  CommonModule,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  BsDropdownModule,

  // @Shared
  ChronoComponent,
  AlertComponent,
  ProgressbarComponent,
  AlertComponent,

  // Externos node_modules
  SwalComponent,
  SwalDirective,
  SwalPortalDirective,
];
