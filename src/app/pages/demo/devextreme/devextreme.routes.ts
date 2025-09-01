import { Routes } from '@angular/router';

export const DEVEXTREME_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'calendar' },

  {
    path: 'calendar',
    title: 'Calendar DevExtreme',
    data: { breadcrumb: 'Demo / DevExtreme / Calendar' },
    loadComponent: () =>
      import('./calendar/calendar-demo.page').then((m) => m.CalendarDemoPage),
  },
  {
    path: 'treeview',
    title: 'TreeView DevExtreme',
    data: { breadcrumb: 'Demo / DevExtreme / TreeView' },
    loadComponent: () =>
      import('./treeview/treeview-demo.page').then((m) => m.TreeviewDemoPage),
  },
  {
    path: 'scheduler',
    title: 'Scheduler DevExtreme',
    data: { breadcrumb: 'Demo / DevExtreme / Scheduler' },
    loadComponent: () =>
      import('./scheduler/scheduler-demo.page').then((m) => m.default),
  },
];
