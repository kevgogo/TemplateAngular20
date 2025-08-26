// src/app/core/services/menu.service.ts
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  forkJoin,
  map,
  of,
  catchError,
} from 'rxjs';

import { CommonService } from '@core/services/common.service';
import { AuthService } from '@core/services/auth.service';

/** Estructura mínima que usa el Sidebar/Shell (la misma que guardas en "menu_nodes") */
export interface MenuNode {
  label: string; // lo que ya consumías
  text?: string; // compat para headers/grupos
  title?: string; // compat adicional
  link?: string;
  icon?: string;
  children?: MenuNode[]; // árbol estándar
  submenu?: MenuNode[]; // alias por si tu template/normalize lo usa
}

/** DTO plano que viene del API (coincide con tu JSON) */
interface RawMenuItem {
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

/** Nodo completo para árbol interno (no lo guardo, pero útil si lo necesitas) */
interface SidebarTreeNode extends RawMenuItem {
  key: number;
  text: string;
  link: string | null;
  isLeaf: boolean;
  children: SidebarTreeNode[];
}

/** Opciones para construir árbol */
interface BuildTreeOptions {
  baseHref?: string; // p.ej. '/plantilla-colibri-app-20'
  filterStatus?: number | null; // 1 = activos, null = no filtra
  allowedPermissions?: Set<string> | string[]; // si quieres filtrar por permiso
}

type MenuUsrItem = {
  text: string;
  link?: string;
  icon?: string;
  submenu?: MenuUsrItem[];
};

@Injectable({ providedIn: 'root' })
export class MenuService {
  // Dependencias
  private _common = inject(CommonService);
  private _auth = inject(AuthService);

  // Storage keys (usando las que ya tienes)
  private readonly SESSION_MENU_NODES = 'menu_nodes';
  private readonly SESSION_MENU_USR = 'menu_usr';
  private readonly SESSION_PERMISSION_MENU = 'permission_menu';

  // Estado reactivo para el Shell
  private _sidebarItems$ = new BehaviorSubject<MenuNode[]>(
    this.readMenuNodesFromSession()
  );

  /** Observable que consume el Shell (toSignal(...)) */
  getSidebarItems$(): Observable<MenuNode[]> {
    return this._sidebarItems$.asObservable();
  }

  /** Refresca el observable leyendo desde session */
  reloadSidebarFromSession(): void {
    this._sidebarItems$.next(this.readMenuNodesFromSession());
  }

  // ------------------------------------------------------------
  // Compat: proxys (si tu proyecto los usa desde aquí)
  // Si NO tienes estos métodos en AuthService, cámbialos a tu HttpClient real.
  // ------------------------------------------------------------
  getMenu(): Observable<any> {
    // Proxy: conserva la firma original de tu proyecto
    return (
      (this._auth as any).getMenu?.() ?? of({ typeResult: 0, objectResult: [] })
    );
  }

  getPermission(): Observable<any> {
    // Proxy: conserva la firma original de tu proyecto
    return (
      (this._auth as any).getPermission?.() ??
      of({ typeResult: 0, objectResult: [] })
    );
  }

  // ------------------------------------------------------------
  // Orquestador: pide menú + permisos, arma árbol y persiste en session
  // ------------------------------------------------------------
  loadAndBuildMenuTree$(
    opts: BuildTreeOptions = {}
  ): Observable<SidebarTreeNode[]> {
    return forkJoin({
      menu: this.getMenu(),
      perms: this.getPermission(),
    }).pipe(
      catchError(() => of({ menu: null, perms: null } as any)),
      map(({ menu, perms }) => {
        // Guarda permisos tal cual los recibes (como ya lo vienes haciendo)
        const permissionMenu = perms?.objectResult ?? [];
        this.writeSession(this.SESSION_PERMISSION_MENU, permissionMenu);

        // Toma items crudos
        const raw: RawMenuItem[] = (menu?.objectResult ?? []) as RawMenuItem[];

        // Arma árbol completo
        const tree = this.buildSidebarTree(raw, { filterStatus: 1, ...opts });

        // Persiste DOS formas que ya usas: menu_nodes (para Sidebar) y menu_usr
        this.persistMenusToSession(tree);

        // Notifica al Shell
        this.reloadSidebarFromSession();

        return tree;
      })
    );
  }

  // ============================================================
  // Internos: lectura/escritura en session
  // ============================================================
  private readMenuNodesFromSession(): MenuNode[] {
    try {
      // Si CommonService ya parsea, úsalo; si no, JSON.parse
      const value = this._common?.obtenerElementoSession
        ? (this._common.obtenerElementoSession(this.SESSION_MENU_NODES) as
            | MenuNode[]
            | null)
        : JSON.parse(sessionStorage.getItem(this.SESSION_MENU_NODES) || '[]');

      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  private writeSession(key: string, data: unknown): void {
    try {
      if (this._common?.registrarElementoSession) {
        this._common.registrarElementoSession(key, data);
      } else {
        sessionStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // no-op
    }
  }

  // ============================================================
  // Internos: construir árbol y adaptar a las dos formas
  // ============================================================
  private buildSidebarTree(
    items: RawMenuItem[],
    opts: BuildTreeOptions = {}
  ): SidebarTreeNode[] {
    const baseHref = opts.baseHref ?? '';
    const filterStatus = opts.filterStatus ?? 1;
    const hasPerms =
      !!opts.allowedPermissions &&
      ((opts.allowedPermissions as any).size ||
        (opts.allowedPermissions as any).length);
    const permSet = Array.isArray(opts.allowedPermissions)
      ? new Set(opts.allowedPermissions)
      : (opts.allowedPermissions as Set<string> | undefined);

    const filtered = items.filter((it) => {
      const statusOk = filterStatus == null ? true : it.status === filterStatus;
      const permOk =
        !hasPerms ||
        !it.permission ||
        (permSet?.has(it.permission.trim()) ?? true);
      return statusOk && permOk;
    });

    const map = new Map<number, SidebarTreeNode>();
    for (const it of filtered) {
      const node: SidebarTreeNode = {
        ...it,
        key: it.id,
        text: (it.name ?? '').trim(),
        link: this.computeLink(it, baseHref),
        isLeaf: false,
        children: [],
      };
      map.set(it.id, node);
    }

    const roots: SidebarTreeNode[] = [];
    for (const node of map.values()) {
      if (node.fatherId != null && map.has(node.fatherId)) {
        map.get(node.fatherId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortRec = (arr: SidebarTreeNode[]) => {
      arr.sort((a, b) => {
        const byOrder = (a.order ?? 0) - (b.order ?? 0);
        return byOrder !== 0 ? byOrder : a.text.localeCompare(b.text);
      });
      for (const n of arr) {
        sortRec(n.children);
        n.isLeaf = n.children.length === 0 && !!n.link;
      }
    };
    sortRec(roots);

    return roots;
  }

  private computeLink(it: RawMenuItem, baseHref = ''): string | null {
    const p = (it.path || '').trim();
    if (p) return this.joinUrl(baseHref, p);

    const c = (it.controller || '').trim();
    const a = (it.action || '').trim();
    const segments = [c, a].filter(Boolean);
    return segments.length ? this.joinUrl(baseHref, ...segments) : null;
  }

  private joinUrl(...parts: string[]): string {
    return parts
      .filter(Boolean)
      .map((s, i) =>
        i === 0 ? s.replace(/\/+$/g, '') : s.replace(/^\/+|\/+$/g, '')
      )
      .join('/')
      .replace(/\/{2,}/g, '/');
  }

  // ============================================================
  // Internos: persistir en las dos formas que ya usas
  // ============================================================
  private persistMenusToSession(tree: SidebarTreeNode[]) {
    const menuNodes = this.toMenuNodes(tree);
    const menuUsr = this.toMenuUsr(tree);

    this.writeSession(this.SESSION_MENU_NODES, menuNodes);
    this.writeSession(this.SESSION_MENU_USR, menuUsr);
  }

  private toMenuNodes(nodes: SidebarTreeNode[], baseHref = ''): MenuNode[] {
    const ensureAbs = (s?: string | null): string | undefined => {
      if (!s) return undefined;
      if (baseHref) return this.joinUrl(baseHref, s);
      return s.startsWith('/') ? s : `/${s}`;
    };

    const map: (n: SidebarTreeNode) => MenuNode = (n) => {
      const lbl = (n.name ?? '').trim(); // 👈 SIEMPRE name
      const item: MenuNode = {
        label: lbl,
        text: lbl, // compat headers
        title: lbl, // compat headers
        link: ensureAbs(n.link),
        icon: this.mapIcon(n.icon),
      };
      const kids = (n.children ?? []).map(map);
      if (kids.length) {
        item.children = kids;
        item.submenu = kids; // compat plantillas que leen 'submenu'
      }
      return item;
    };
    return nodes.map(map);
  }

  private toMenuUsr(nodes: SidebarTreeNode[]): MenuUsrItem[] {
    const map: (n: SidebarTreeNode) => MenuUsrItem = (n) => ({
      text: (n.name ?? '').trim(), // 👈 SIEMPRE name
      link: n.link || undefined,
      icon: this.mapIcon(n.icon),
      submenu: (n.children ?? []).map(map),
    });
    return nodes.map(map);
  }

  // Mapeo opcional de FontAwesome -> Bootstrap Icons (ajusta a tu gusto)
  private mapIcon(icon?: string | null): string | undefined {
    if (!icon) return undefined;
    const x = icon.trim().toLowerCase();
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
      'fa fa-motorcycle': 'bi-truck',
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
    return dict[x] ?? icon;
  }
}
