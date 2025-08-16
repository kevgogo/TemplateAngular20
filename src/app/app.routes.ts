// app.routes.ts
import { Routes } from '@angular/router';
import { ShellComponent } from '@layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    // Si el componente tiene export default:
    loadComponent: () =>
      import('./core/auth/auth-callback.component').then((m) => m.default),
  },
  {
    path: '',
    component: ShellComponent,
    data: { breadcrumbSkip: true },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        title: 'Dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () =>
          import('@pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'elements',
        title: 'Elementos Básicos',
        data: { breadcrumb: 'Elementos Básicos' },
        loadComponent: () =>
          import('@pages/elements/basic-elements.page').then(
            (m) => m.BasicElementsPage
          ),
      },

      // (opcional) 404 dentro del shell
      { path: '**', redirectTo: 'dashboard' },
    ],
  },

  // (opcional) 404 global
  { path: '**', redirectTo: '' },
];
