// app.routes.ts
import { Routes } from '@angular/router';
import { ShellComponent } from '@layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    // opcional: evita que el shell aparezca como tramo del breadcrumb
    data: { breadcrumbSkip: true },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'Dashboard' },

      {
        path: 'Dashboard',
        title: 'Dashboard',
        data: { breadcrumb: 'Dashboard' }, // <- etiqueta del breadcrumb
        loadComponent: () =>
          import('@pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'BasicElements',
        title: 'Elementos Basicos',
        data: { breadcrumb: 'Elementos Basicos' },
        loadComponent: () =>
          import('@pages/elements/basic-elements.page').then(
            (m) => m.BasicElementsPage
          ),
      },
      {
        path: 'BasicElements',
        title: 'Elementos Basicos',
        data: { breadcrumb: 'Elementos Basicos' },
        loadComponent: () =>
          import('@pages/elements/basic-elements.page').then(
            (m) => m.BasicElementsPage
          ),
      },
    ],
  },
];
