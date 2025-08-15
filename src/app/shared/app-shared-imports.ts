// src/app/shared/app-shared-imports.ts
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
// tus componentes standalone
import { NavbarComponent } from '@layout/navbar/navbar.component';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { BreadcrumbsComponent } from '@layout/breadcrumbs/breadcrumbs.component';
import { HeadbarComponent } from '@layout/headbar/headbar.component';
import { SidebarLegacyComponent } from '@layout/sidebar-legacy/sidebar-legacy.component';

export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  NavbarComponent,
  SidebarComponent,
  SidebarLegacyComponent,
  BreadcrumbsComponent,
  HeadbarComponent,
  BsDropdownModule,
];
