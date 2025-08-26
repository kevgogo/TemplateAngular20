import { RawMenuItem, SidebarNode } from '@core/models/menu.types';
import { buildSidebarTree, BuildTreeOptions } from '@core/utils/menu-tree.util';

export type MenuNodesItem = {
  label: string;
  link?: string;
  icon?: string;
  children?: MenuNodesItem[];
};

export type MenuUsrItem = {
  text: string;
  link?: string;
  icon?: string;
  submenu?: MenuUsrItem[];
};

/** Convierte SidebarNode -> shape de menu_nodes */
export function toMenuNodes(nodes: SidebarNode[]): MenuNodesItem[] {
  const map = (n: SidebarNode): MenuNodesItem => ({
    label: n.text || n.name || '',
    link: n.link || undefined,
    icon: mapIcon(n.icon),
    children: (n.children ?? []).map(map),
  });
  return nodes.map(map);
}

/** Convierte SidebarNode -> shape de menu_usr */
export function toMenuUsr(nodes: SidebarNode[]): MenuUsrItem[] {
  const map = (n: SidebarNode): MenuUsrItem => ({
    text: n.text || n.name || '',
    link: n.link || undefined,
    icon: mapIcon(n.icon),
    submenu: (n.children ?? []).map(map),
  });
  return nodes.map(map);
}

/** Guarda ambas estructuras usando las llaves que ya tienes */
export function persistMenusToSession(
  tree: SidebarNode[],
  storage: Storage = sessionStorage
) {
  try {
    storage.setItem('menu_nodes', JSON.stringify(toMenuNodes(tree)));
    storage.setItem('menu_usr', JSON.stringify(toMenuUsr(tree)));
    storage.setItem('menu_nodes_updated_at', new Date().toISOString());
  } catch {
    /* no-op */
  }
}

/** Si usas FA en backend y BI en frontend, mapea algunos comunes */
function mapIcon(icon?: string | null): string | undefined {
  if (!icon) return undefined;
  const x = icon.trim().toLowerCase();

  // mapeos rápidos (ajusta lo que uses)
  const dict: Record<string, string> = {
    'fa fa-cog': 'bi-gear',
    'fa fa-cogs': 'bi-gear-wide-connected',
    'fa fa-puzzle-piece': 'bi-puzzle',
    'fa fa-list-alt': 'bi-card-checklist',
    'fa fa-server': 'bi-hdd-network',
    'fa fa-user-secret': 'bi-person-badge',
    'fa fa-street-view': 'bi-geo-alt',
    'fa fa-mortar-board': 'bi-mortarboard',
    'fa fa-clock-o': 'bi-clock',
    'fa fa-columns': 'bi-layout-three-columns',
    'fa fa-automobile': 'bi-truck',
    'fa fa-history': 'bi-arrow-clockwise',
    'fa fa-clipboard': 'bi-clipboard',
    'fa fa-shopping-cart': 'bi-cart',
    'fa fa-bank': 'bi-bank',
    'fa fa-truck': 'bi-truck',
    'fa fa-anchor': 'bi-anchor',
    'fa fa-tag': 'bi-tag',
    'fa fa-users': 'bi-people',
    'fa fa-navicon': 'bi-list',
    'fa fa-calendar-o': 'bi-calendar3',
    'fa fa-calendar': 'bi-calendar3-event',
    'fa fa-underline': 'bi-rulers',
    'fa fa-refresh': 'bi-arrow-repeat',
    'fa fa-bar-chart': 'bi-bar-chart',
    'fa fa-sort-numeric-asc': 'bi-sort-numeric-down',
    'fa fa-question': 'bi-question-circle',
    'fa fa-cubes': 'bi-boxes',
    'fa fa-cube': 'bi-box',
    'fa fa-stack-overflow': 'bi-layers',
    'fa fa-check-square': 'bi-check2-square',
    'fa fa-check-square-o': 'bi-check-square',
    'fa fa-bicycle': 'bi-bicycle',
    'fa fa-motorcycle': 'bi-truck', // ajusta si tienes icono de moto
    'fa fa-certificate': 'bi-award',
    'fa fa-eye': 'bi-eye',
    'fa fa-external-link': 'bi-box-arrow-up-right',
    'fa fa-bars': 'bi-ui-checks-grid',
    'fa fa-link': 'bi-link-45deg',
    'fa fa-chain-broken': 'bi-link',
    'fa fa-bullseye': 'bi-bullseye',
    'fa fa-sliders': 'bi-sliders',
    'fa fa-cart-plus': 'bi-cart-plus',
    'fa fa-cart-arrow-down': 'bi-cart-dash',
  };

  return dict[x] ?? icon; // si no hay mapping, deja el original
}

/** Helper de alto nivel: de plano -> árbol -> persistir */
export function buildAndPersistMenus(
  raw: RawMenuItem[],
  opts: BuildTreeOptions = {},
  storage: Storage = sessionStorage
) {
  const tree = buildSidebarTree(raw, { filterStatus: 1, ...opts });
  persistMenusToSession(tree, storage);
  return tree;
}
