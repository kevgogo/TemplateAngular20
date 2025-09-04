// src/app/features/demo/demo.routes.ts
import { Routes } from '@angular/router';

export const DEMO_ROUTES: Routes = [
  {
    path: 'elements',
    data: { title: 'Elementos Básicos' },
    loadComponent: () =>
      import('@pages/demo/elements/basic-elements.page').then(
        (m) => m.BasicElementsPage,
      ),
  },
  {
    path: 'shared',
    loadComponent: () =>
      import('@pages/demo/shared/shared-showcase.page').then(
        (m) => m.SharedShowcasePage,
      ),
  },
  {
    path: 'graphql',
    loadComponent: () =>
      import('@pages/demo/graphql/graphql-demo.page').then(
        (m) => m.GraphqlDemoPage,
      ),
  },
  {
    path: 'messages',
    loadComponent: () =>
      import('@pages/demo/messages/messages-demo.page').then(
        (m) => m.DemoMessagesPage,
      ),
  },
  {
    path: 'modals',
    loadComponent: () =>
      import('@pages/demo/modals/modal-inject-demo.page').then(
        (m) => m.ModalInjectDemoPage,
      ),
  },
  {
    path: 'devextreme/calendar',
    loadComponent: () =>
      import('@pages/demo/devextreme/calendar/calendar-demo.page').then(
        (m) => m.CalendarDemoPage,
      ),
  },
  {
    path: 'devextreme/treeview',
    loadComponent: () =>
      import('@pages/demo/devextreme/treeview/treeview-demo.page').then(
        (m) => m.TreeviewDemoPage,
      ),
  },
  {
    path: 'chrono',
    loadComponent: () =>
      import('@pages/demo/chrono/chrono-demo.page').then(
        (m) => m.ChronoDemoPage,
      ),
  },
  {
    path: 'files',
    loadComponent: () =>
      import('@pages/demo/files/files-demo.page').then((m) => m.FilesDemoPage),
  },
  {
    path: 'test/adder',
    loadComponent: () =>
      import('@pages/demo/test/adder.component').then((m) => m.AdderComponent),
  },
  {
    path: 'icons-explorer/icons',
    loadComponent: () =>
      import('@pages/demo/fa4-search/fa4-search.component').then(
        (m) => m.Fa4SearchComponent,
      ),
  },
  {
    path: 'icons/fa4',
    loadComponent: () =>
      import('@pages/demo/fa4-search/fa4-search.component').then(
        (m) => m.Fa4SearchComponent,
      ),
  },
];
