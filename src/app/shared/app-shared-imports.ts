// src/app/shared/app-shared-imports.ts
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  BsDropdownModule,
];
