import type { UrlTree } from '@angular/router';
import { RawMenuItem, SidebarNode } from '@core/models/menu.types';
import { buildSidebarTree, BuildTreeOptions } from '@core/utils/menu-tree.util';

export interface MenuNodesItem {
  label: string;
  link?: string;
  icon?: string;
  children?: MenuNodesItem[];
}

export interface MenuUsrItem {
  text: string;
  link?: string | readonly unknown[] | UrlTree;
  icon?: string;
  submenu?: MenuUsrItem[];
}

export function toMenuNodes(nodes: SidebarNode[]): MenuNodesItem[] {
  const map = (n: SidebarNode): MenuNodesItem => ({
    label: n.text || n.name || '',
    link: n.link ?? undefined,
    icon: n.icon,
    children: (n.children ?? []).map(map),
  });
  return nodes.map(map);
}

export function toMenuUsr(nodes: SidebarNode[]): MenuUsrItem[] {
  const map = (n: SidebarNode): MenuUsrItem => ({
    text: n.text || n.name || '',
    link: n.link ?? undefined,
    icon: n.icon,
    submenu: (n.children ?? []).map(map),
  });
  return nodes.map(map);
}

export function persistMenusToSession(
  tree: SidebarNode[],
  storage: Storage = sessionStorage,
) {
  try {
    storage.setItem('menu_nodes', JSON.stringify(toMenuNodes(tree)));
    storage.setItem('menu_usr', JSON.stringify(toMenuUsr(tree)));
    storage.setItem('menu_nodes_updated_at', new Date().toISOString());
  } catch {
    /* no-op */
  }
}

export function buildAndPersistMenus(
  raw: RawMenuItem[],
  opts: BuildTreeOptions = {},
  storage: Storage = sessionStorage,
) {
  const tree = buildSidebarTree(raw, { filterStatus: 1, ...opts });
  persistMenusToSession(tree, storage);
  return tree;
}
