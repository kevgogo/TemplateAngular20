import { UrlTree } from '@angular/router';

export interface ApiMenuResponse {
  typeResult: number;
  objectResult: RawMenuItem[];
  messageResult: string | null;
}

export interface RawMenuItem {
  id: number;
  fatherId: number | null;
  moduleId: number | null;
  name: string;
  nameSpanish: string | null;
  controller: string | null;
  action: string | null;
  description: string;
  description2: string | null;
  path: string;
  icon: string;
  order: number;
  status: number;
  menuName: string | null;
  moduleName: string | null;
  permission: string | null;
}

export interface SidebarNode extends RawMenuItem {
  key: number;
  text: string;
  link: string | null;
  isLeaf: boolean;
  children: SidebarNode[];
  title?: string;
  submenu?: SidebarNode[];
}

export type RouteLink = string | readonly unknown[] | UrlTree;

export interface SidebarItem {
  text: string;
  link?: RouteLink | null;
  icon?: string | null;
  submenu?: SidebarItem[] | null;
}

export interface MenuNode {
  label: string;
  link?: RouteLink;
  icon?: string;
  children?: MenuNode[];
}

export type AnySidebarItem = MenuNode | SidebarItem;
export type AnyItem = MenuNode | SidebarItem;
