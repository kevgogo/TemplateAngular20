import { Routes } from '@angular/router';
import { ShellComponent } from '@layout/shell/shell.component';
import { accessControlGuard } from '@core/guards/access-control.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./core/auth/auth-callback.component').then((m) => m.default),
  },
  {
    path: 'Login',
    loadComponent: () =>
      import('./core/auth/auth-callback.component').then((m) => m.default),
  },
  {
    path: '',
    component: ShellComponent,
    data: { breadcrumbSkip: true },
    // canActivate: [accessControlGuard], // actívalo si quieres sesión para todo el shell
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' }, // <— CAMBIO
      {
        path: 'home',
        title: 'Inicio',
        data: {
          breadcrumb: 'Inicio',
          hideHeadbarTitle: true,
        },
        loadComponent: () =>
          import('@pages/home/home.page').then((m) => m.HomePage), // <— NUEVO
      },
      {
        path: 'dashboard',
        title: 'Dashboard',
        data: { breadcrumb: 'Dashboard' },
        // canActivate: [accessControlGuard],
        loadComponent: () =>
          import('@pages/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },

      // Errores (ahora desde shared/pages/errors)
      {
        path: 'error/401',
        title: 'No autorizado',
        data: { breadcrumb: '401' },
        loadComponent: () =>
          import('@pages/errors/unauthorized.page').then(
            (m) => m.UnauthorizedPage
          ),
      },
      {
        path: 'error/403',
        title: 'Acceso denegado',
        data: { breadcrumb: '403' },
        loadComponent: () =>
          import('@pages/errors/forbidden.page').then((m) => m.ForbiddenPage),
      },
      {
        path: 'error/404',
        title: 'Página no encontrada',
        data: { breadcrumb: '404' },
        loadComponent: () =>
          import('@pages/errors/not-found.page').then((m) => m.NotFoundPage),
      },
      {
        path: 'error/500',
        title: 'Error del servidor',
        data: { breadcrumb: '500' },
        loadComponent: () =>
          import('@pages/errors/server-error.page').then(
            (m) => m.ServerErrorPage
          ),
      },

      {
        path: 'demo',
        loadChildren: () =>
          import('@pages/demo/demo.routes').then((m) => m.DEMO_ROUTES),
      },

      // 404 para rutas desconocidas dentro del shell
      { path: '**', redirectTo: 'error/404' },
    ],
  },

  // Fallback global
  { path: '**', redirectTo: '' },
];
