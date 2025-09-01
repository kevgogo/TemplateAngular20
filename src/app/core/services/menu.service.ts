// src/app/core/services/menu.service.ts
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  map,
  of,
} from 'rxjs';

import type {
  MenuNode,
  RawMenuItem,
  RouteLink,
  SidebarNode,
} from '@core/models/menu.types';
import { AuthService } from '@core/services/auth.service';
import { CommonService } from '@core/services/common.service';
import type { MenuUsrItem } from '@core/utils/menu-adapters.util';
import type { BuildTreeOptions } from '@core/utils/menu-tree.util';
import { DEMO_MENU } from '@shared/mock/fake-menu';

/* ===================== Tipos auxiliares seguros ===================== */

/** Respuesta mínima esperada de API de menú */
interface MenuResponse {
  typeResult?: number;
  objectResult?: RawMenuItem[] | null | undefined;
}

/** Item de permisos con nombres comunes */
type PermItem =
  | string
  | {
      name?: string;
      permission?: string;
      code?: string;
      permission_name?: string;
      Permission?: string;
      Name?: string;
    };

/** Respuesta mínima esperada de API de permisos */
interface PermsResponse {
  typeResult?: number;
  objectResult?: PermItem[] | null | undefined;
}

/* ===================== Guards de tipos ===================== */

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isSidebarNodeArray(x: unknown): x is SidebarNode[] {
  return Array.isArray(x) && x.every((e) => isObject(e));
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((e) => typeof e === 'string');
}

/* ===================== Servicio ===================== */

@Injectable({ providedIn: 'root' })
export class MenuService {
  // Dependencias
  private readonly _common = inject(CommonService);
  private readonly _auth = inject(AuthService);

  // Storage keys
  private readonly SESSION_MENU_NODES = 'menu_nodes';
  private readonly SESSION_MENU_USR = 'menu_usr';
  private readonly SESSION_PERMISSION_MENU = 'permission_menu';

  // Estado reactivo para el Shell
  private readonly _sidebarItems$ = new BehaviorSubject<SidebarNode[]>(
    this.readMenuNodesFromSession(),
  );

  /** Observable que consume el Shell (toSignal(...)) */
  getSidebarItems$(): Observable<SidebarNode[]> {
    return this._sidebarItems$.asObservable();
  }

  /** Snapshot actual (opcional) */
  getSidebarItemsSnapshot(): SidebarNode[] {
    return this._sidebarItems$.value;
  }

  /** Refresca el observable leyendo desde storage */
  reloadSidebarFromSession(): void {
    this._sidebarItems$.next(this.readMenuNodesFromSession());
  }

  /* ===================== Orquestador ===================== */

  /**
   * Pide menú + permisos, inyecta extras del mock, arma árbol y persiste en storage.
   * Devuelve el árbol listo para el Sidebar.
   */
  loadAndBuildMenuTree$(
    opts: BuildTreeOptions = {},
  ): Observable<SidebarNode[]> {
    // Normalizamos cada request con su catchError para tipar forkJoin
    const menu$ = this._auth.getMenu().pipe(
      map((r) => (r as MenuResponse) ?? { objectResult: [] }),
      catchError(() => of<MenuResponse>({ objectResult: [] })),
    );

    const perms$ = this._auth.getPermission().pipe(
      map((r) => (r as PermsResponse) ?? { objectResult: [] }),
      catchError(() => of<PermsResponse>({ objectResult: [] })),
    );

    return forkJoin({ menu: menu$, perms: perms$ }).pipe(
      map(({ menu, perms }) => {
        // Guarda permisos tal cual los recibes (lo normalizas al usarlos)
        const permissionMenu = perms.objectResult ?? [];
        this.writeStorage(this.SESSION_PERMISSION_MENU, permissionMenu);

        // Items crudos
        const raw: RawMenuItem[] = menu.objectResult ?? [];

        // Inyecta extras (mock) sin duplicar por path/controller/action
        const rawWithExtras = this._mergeExtras(raw, DEMO_MENU);

        // Arma árbol completo
        const tree = this.buildSidebarTree(rawWithExtras, {
          filterStatus: 1,
          ...opts,
        });

        // Persiste en las dos formas que ya usas
        this.persistMenusToStorage(tree);

        // Actualiza stream para el Shell
        this._sidebarItems$.next(tree);

        return tree;
      }),
    );
  }

  /* ===================== Storage helpers ===================== */

  private readMenuNodesFromSession(): SidebarNode[] {
    try {
      // 1) Intento vía CommonService (genérico y tipado)
      const fromCommon =
        this._common?.obtenerElementoSession<unknown>(
          this.SESSION_MENU_NODES,
          null,
        ) ?? null;
      if (isSidebarNodeArray(fromCommon)) return fromCommon;

      // 2) Fallback: localStorage directo (con ?? y parse seguro)
      const json = localStorage.getItem(this.SESSION_MENU_NODES) ?? '[]';
      let parsed: unknown;
      try {
        parsed = JSON.parse(json) as unknown;
      } catch {
        parsed = [];
      }
      return isSidebarNodeArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeStorage(key: string, data: unknown): void {
    try {
      if (this._common?.registrarElementoSession) {
        this._common.registrarElementoSession(key, data);
      } else {
        localStorage.setItem(key, JSON.stringify(data));
      }
    } catch {
      // no-op
    }
  }

  /* ===================== Merge de extras ===================== */

  /** Genera una llave estable por item para evitar duplicados entre API y extras */
  private _itemKey(
    it: Pick<RawMenuItem, 'path' | 'controller' | 'action'>,
  ): string {
    const p = (it.path ?? '').trim().toLowerCase();
    const c = (it.controller ?? '').trim().toLowerCase();
    const a = (it.action ?? '').trim().toLowerCase();
    return p || (c && a ? `${c}/${a}` : '');
  }

  /** Funde extras con raw (sin duplicar por path o controller/action) */
  private _mergeExtras(
    raw: RawMenuItem[],
    extras: RawMenuItem[],
  ): RawMenuItem[] {
    const seen = new Set(raw.map((x) => this._itemKey(x)).filter(Boolean));
    const merged = raw.slice();

    for (const it of extras) {
      const k = this._itemKey(it);
      if (!k || seen.has(k)) continue;
      merged.push(it);
      seen.add(k);
    }
    return merged;
  }

  /* ===================== Construcción del árbol ===================== */

  private buildSidebarTree(
    items: RawMenuItem[],
    opts: BuildTreeOptions = {},
  ): SidebarNode[] {
    const baseHref = opts.baseHref ?? '';
    const filterStatus = opts.filterStatus ?? 1;

    // allowedPermissions puede ser Set<string> o string[]
    const permSet: Set<string> | undefined = Array.isArray(
      opts.allowedPermissions,
    )
      ? new Set(opts.allowedPermissions)
      : opts.allowedPermissions instanceof Set
        ? opts.allowedPermissions
        : undefined;

    const filtered = items.filter((it) => {
      const statusOk = filterStatus == null ? true : it.status === filterStatus;
      const permOk =
        !permSet || !it.permission || permSet.has(it.permission.trim());
      return statusOk && permOk;
    });

    const mapNodes = new Map<number, SidebarNode>();
    for (const it of filtered) {
      const node: SidebarNode = {
        ...it,
        key: it.id,
        text: (it.name ?? '').trim(),
        link: this.computeLink(it, baseHref),
        isLeaf: false,
        children: [],
      };
      mapNodes.set(it.id, node);
    }

    const roots: SidebarNode[] = [];
    for (const node of mapNodes.values()) {
      if (node.fatherId != null && mapNodes.has(node.fatherId)) {
        mapNodes.get(node.fatherId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortRec = (arr: SidebarNode[]) => {
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
    if (p) {
      const full = this.joinUrl(baseHref, p);
      return full.startsWith('/') ? full : '/' + full; // garantiza slash inicial
    }
    const c = (it.controller ?? '').trim();
    const a = (it.action ?? '').trim();
    const segments = [c, a].filter(Boolean);
    if (!segments.length) return null;
    const full = this.joinUrl(baseHref, ...segments);
    return full.startsWith('/') ? full : '/' + full;
  }

  private joinUrl(...parts: string[]): string {
    return parts
      .filter(Boolean)
      .map((s, i) =>
        i === 0 ? s.replace(/\/+$/g, '') : s.replace(/^\/+|\/+$/g, ''),
      )
      .join('/')
      .replace(/\/{2,}/g, '/');
  }

  /* ===================== Persistencia en storage ===================== */

  private persistMenusToStorage(tree: SidebarNode[]): void {
    const menuNodes = this.toMenuNodes(tree);
    const menuUsr = this.toMenuUsr(tree);

    this.writeStorage(this.SESSION_MENU_NODES, menuNodes);
    this.writeStorage(this.SESSION_MENU_USR, menuUsr);
  }

  private toMenuNodes(nodes: SidebarNode[], baseHref = ''): MenuNode[] {
    // Normaliza strings a rutas absolutas
    const ensureAbs = (s?: string | null): string | undefined => {
      if (!s) return undefined;
      const t = String(s).trim();
      if (!t) return undefined;
      const full = baseHref ? this.joinUrl(baseHref, t) : t;
      return full.startsWith('/') ? full : `/${full}`;
    };

    // Convierte comandos RouterLink (string[]) a ruta string absoluta
    const commandsToAbs = (arr: string[]): string | undefined => {
      if (!arr.length) return undefined;
      const full = baseHref
        ? this.joinUrl(baseHref, ...arr)
        : this.joinUrl(...arr);
      return full.startsWith('/') ? full : `/${full}`;
    };

    // Acepta string o comandos; devuelve SIEMPRE string (ajusta a tu RouteLink)
    const ensureLink = (v: unknown): RouteLink | undefined => {
      if (typeof v === 'string') return ensureAbs(v);
      if (isStringArray(v)) return commandsToAbs(v); // <-- ya no casteamos a RouteLink
      return undefined;
    };

    const mapNode = (n: SidebarNode): MenuNode => {
      const lbl = (n.name ?? n.text ?? '').toString().trim();
      const item: MenuNode = { label: lbl };

      const linkVal = ensureLink(n.link);
      if (linkVal !== undefined) item.link = linkVal;

      if (typeof n.icon === 'string' && n.icon.trim()) {
        item.icon = n.icon;
      }

      const kids = (n.children ?? []).map(mapNode);
      if (kids.length) item.children = kids;

      return item;
    };

    return (nodes ?? []).map(mapNode);
  }

  private toMenuUsr(nodes: SidebarNode[]): MenuUsrItem[] {
    const mapOne = (n: SidebarNode): MenuUsrItem => ({
      text: (n.name ?? '').trim(),
      link: n.link ?? undefined,
      icon: n.icon,
      submenu: (n.children ?? []).map(mapOne),
    });
    return nodes.map(mapOne);
  }
}
