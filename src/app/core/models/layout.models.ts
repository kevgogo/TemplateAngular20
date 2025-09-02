export type SidebarMode = 'fixed' | 'floating';

export interface LayoutState {
  sidebarMode: SidebarMode;
  sidebarCollapsed: boolean;
  floatingOpen: boolean;
}

export type Area = 'nav' | 'breadcrumbs' | 'headbar' | 'sidebar';
export type Position = 'fixed' | 'sticky' | 'static';

export interface LayoutPositions {
  nav: Position;
  breadcrumbs: Position;
  headbar: Position;
  sidebar: Position;
}

export interface LayoutToggles {
  navFixed: boolean;
  breadcrumbsFixed: boolean;
  pageHeaderFixed: boolean;
}
