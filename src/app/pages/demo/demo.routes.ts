// src/app/features/demo/demo.routes.ts
import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    title: 'Demos',
    children: [
      {
        path: 'elements',
        title: 'Elementos Básicos',
        loadComponent: () =>
          import('@pages/demo/elements/basic-elements.page').then(
            (m) => m.BasicElementsPage,
          ),
      },
      {
        path: 'shared',
        title: 'Shared Showcase',
        loadComponent: () =>
          import('@pages/demo/shared/shared-showcase.page').then(
            (m) => m.SharedShowcasePage,
          ),
      },
      {
        path: 'graphql',
        title: 'GraphQL Demo',
        loadComponent: () =>
          import('@pages/demo/graphql/graphql-demo.page').then(
            (m) => m.GraphqlDemoPage,
          ),
      },
      {
        path: 'messages',
        title: 'Mensajes & Alertas',
        loadComponent: () =>
          import('@pages/demo/messages/messages-demo.page').then(
            (m) => m.DemoMessagesPage,
          ),
      },
      {
        path: 'modals',
        title: 'Modales con inyección',
        loadComponent: () =>
          import('@pages/demo/modals/modal-inject-demo.page').then(
            (m) => m.ModalInjectDemoPage,
          ),
      },
      {
        path: 'devextreme/calendar',
        title: 'DevExtreme Calendar',
        loadComponent: () =>
          import('@pages/demo/devextreme/calendar-demo.page').then(
            (m) => m.CalendarDemoPage,
          ),
      },
      {
        path: 'devextreme/treeview',
        title: 'DevExtreme TreeView',
        loadComponent: () =>
          import('@pages/demo/devextreme/treeview-demo.page').then(
            (m) => m.TreeviewDemoPage,
          ),
      },
      {
        path: 'chrono',
        title: 'Chrono / Reloj',
        loadComponent: () =>
          import('@pages/demo/chrono/chrono-demo.page').then(
            (m) => m.ChronoDemoPage,
          ),
      },
      {
        path: 'files',
        title: 'PDF/Excel/ZIP',
        loadComponent: () =>
          import('@pages/demo/files/files-demo.page').then(
            (m) => m.FilesDemoPage,
          ),
      },
      {
        path: 'test/adder',
        title: 'Demo · Test · Adder',
        loadComponent: () =>
          import('@pages/demo/test/adder.component').then(
            (m) => m.AdderComponent,
          ),
      },
      {
        path: 'icons-explorer/icons',
        title: 'Selector de Iconos',
        loadComponent: () =>
          import(
            '@pages/demo/icons/icons-explorer/fa-icons-explorer.page'
          ).then((m) => m.FaIconsExplorerPage),
      },
      {
        path: 'icons/fa4',
        title: 'Buscador FA 4.7.0',
        loadComponent: () =>
          import('@pages/demo/icons/fa4-search/fa4-search.component').then(
            (m) => m.Fa4SearchComponent,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'shared' },
    ],
  },
];
