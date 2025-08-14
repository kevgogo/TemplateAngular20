// src/app/shared/app-shared-imports.ts
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';

// tus componentes standalone
import { NavbarComponent } from '@layout/navbar/navbar.component';
import { SidebarComponent } from '@layout/sidebar/sidebar.component';
import { BreadcrumbsComponent } from '@layout/breadcrumbs/breadcrumbs.component';
import { HeadbarComponent } from '@layout/headbar/headbar.component';

export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterOutlet,
  NavbarComponent,
  SidebarComponent,
  BreadcrumbsComponent,
  HeadbarComponent,
];
