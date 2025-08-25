// src/app/features/demo/demo.routes.ts
import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: 'demo',
    title: 'Demos',
    data: { breadcrumb: 'Demos' },
    children: [
      {
        path: 'shared',
        title: 'Shared Showcase',
        loadComponent: () =>
          import('./shared/shared-showcase.page').then(
            (m) => m.SharedShowcasePage
          ),
      },
      {
        path: 'graphql',
        title: 'GraphQL Demo',
        loadComponent: () =>
          import('./graphql/graphql-demo.page').then((m) => m.GraphqlDemoPage),
      },
      {
        path: 'messages',
        title: 'Mensajes & Alertas',
        loadComponent: () =>
          import('./messages/messages-demo.page').then(
            (m) => m.MessagesDemoPage
          ),
      },
      {
        path: 'modals',
        title: 'Modales con inyección',
        loadComponent: () =>
          import('./modals/modal-inject-demo.page').then(
            (m) => m.ModalInjectDemoPage
          ),
      },
      {
        path: 'devextreme/calendar',
        title: 'DevExtreme Calendar',
        loadComponent: () =>
          import('./devextreme/calendar-demo.page').then(
            (m) => m.CalendarDemoPage
          ),
      },
      {
        path: 'devextreme/treeview',
        title: 'DevExtreme TreeView',
        loadComponent: () =>
          import('./devextreme/treeview-demo.page').then(
            (m) => m.TreeviewDemoPage
          ),
      },
      {
        path: 'chrono',
        title: 'Chrono / Reloj',
        loadComponent: () =>
          import('./chrono/chrono-demo.page').then((m) => m.ChronoDemoPage),
      },
      {
        path: 'files',
        title: 'PDF/Excel/ZIP',
        loadComponent: () =>
          import('./files/files-demo.page').then((m) => m.FilesDemoPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'shared' },
    ],
  },
];
