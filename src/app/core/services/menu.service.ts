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
import {
  RawMenuItem,
  SidebarNode,
  MenuNode,
  RouteLink,
} from '@core/models/menu.types';
import { BuildTreeOptions } from '@core/utils/menu-tree.util';
import { DEMO_MENU } from '@shared/mock/fake-menu';
import { MenuUsrItem } from '@core/utils/menu-adapters.util';

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
  private _sidebarItems$ = new BehaviorSubject<SidebarNode[]>(
    this.readMenuNodesFromSession()
  );

  /** Observable que consume el Shell (toSignal(...)) */
  getSidebarItems$(): Observable<SidebarNode[]> {
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
  // Orquestador: pide menú + permisos, inyecta extras, arma árbol y persiste
  // ------------------------------------------------------------
  loadAndBuildMenuTree$(
    opts: BuildTreeOptions = {}
  ): Observable<SidebarNode[]> {
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

        // ⬇️ Inyecta extras FA4 del mock (sin duplicar)
        const rawWithExtras = this._mergeExtras(
          raw,
          DEMO_MENU as RawMenuItem[]
        );

        // Arma árbol completo
        const tree = this.buildSidebarTree(rawWithExtras, {
          filterStatus: 1,
          ...opts,
        });

        // Persiste DOS formas que ya usas: menu_nodes (para Sidebar) y menu_usr
        this.persistMenusToSession(tree);

        // TODO: Cargamos los menus de @shared/mock/fake-menu
        this._sidebarItems$.next(tree);

        // Notifica al Shell
        this.reloadSidebarFromSession();

        return tree;
      })
    );
  }

  // ============================================================
  // Internos: lectura/escritura en session
  // ============================================================
  private readMenuNodesFromSession(): SidebarNode[] {
    try {
      // Si CommonService ya parsea, úsalo; si no, JSON.parse
      const value = this._common?.obtenerElementoSession
        ? (this._common.obtenerElementoSession(this.SESSION_MENU_NODES) as
            | SidebarNode[]
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
  // Internos: merge de extras y utilidades de clave
  // ============================================================
  /** Genera una llave estable por item para evitar duplicados entre API y extras */
  private _itemKey(
    it: Pick<RawMenuItem, 'path' | 'controller' | 'action'>
  ): string {
    const p = (it.path || '').trim().toLowerCase();
    const c = (it.controller || '').trim().toLowerCase();
    const a = (it.action || '').trim().toLowerCase();
    return p || (c && a ? `${c}/${a}` : '');
  }

  /** Funde extras con raw (sin duplicar por path o controller/action) */
  private _mergeExtras(
    raw: RawMenuItem[],
    extras: RawMenuItem[]
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

  // ============================================================
  // Internos: construir árbol
  // ============================================================
  private buildSidebarTree(
    items: RawMenuItem[],
    opts: BuildTreeOptions = {}
  ): SidebarNode[] {
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

    const map = new Map<number, SidebarNode>();
    for (const it of filtered) {
      const node: SidebarNode = {
        ...it,
        key: it.id,
        text: (it.name ?? '').trim(),
        link: this.computeLink(it, baseHref),
        isLeaf: false,
        children: [],
      };
      map.set(it.id, node);
    }

    const roots: SidebarNode[] = [];
    for (const node of map.values()) {
      if (node.fatherId != null && map.has(node.fatherId)) {
        map.get(node.fatherId)!.children.push(node);
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
      return full.startsWith('/') ? full : '/' + full; // ⬅️ garantiza slash inicial
    }
    const c = (it.controller || '').trim();
    const a = (it.action || '').trim();
    const segments = [c, a].filter(Boolean);
    if (!segments.length) return null;
    const full = this.joinUrl(baseHref, ...segments);
    return full.startsWith('/') ? full : '/' + full; // ⬅️ idem
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
  private persistMenusToSession(tree: SidebarNode[]) {
    const menuNodes = this.toMenuNodes(tree);
    const menuUsr = this.toMenuUsr(tree);

    this.writeSession(this.SESSION_MENU_NODES, menuNodes);
    this.writeSession(this.SESSION_MENU_USR, menuUsr);
  }

  private toMenuNodes(nodes: SidebarNode[], baseHref = ''): MenuNode[] {
    // Normaliza strings a rutas absolutas; si no hay, NO asignamos la prop
    const ensureAbs = (s?: string | null): string | undefined => {
      if (!s) return undefined;
      const t = String(s).trim();
      if (!t) return undefined;
      const full = baseHref ? this.joinUrl(baseHref, t) : t;
      return full.startsWith('/') ? full : `/${full}`;
    };

    // Acepta string | any[]; nunca regresa null
    const ensureLink = (v: unknown): RouteLink | undefined => {
      if (Array.isArray(v)) return v as any[];
      if (typeof v === 'string') return ensureAbs(v);
      return undefined;
    };

    const mapNode = (n: SidebarNode): MenuNode => {
      const lbl =
        (n as any).name?.toString?.().trim?.() ??
        (n as any).text?.toString?.().trim?.() ??
        (n as any).label?.toString?.().trim?.() ??
        '';

      const item: MenuNode = { label: lbl };

      const linkVal = ensureLink((n as any).link);
      if (linkVal !== undefined) item.link = linkVal;

      // ⚠️ Dejamos FA4 tal cual; NO convertimos a Bootstrap Icons
      const rawIcon: string | undefined | null = (n as any).icon ?? undefined;
      if (rawIcon) item.icon = rawIcon;

      const kids = (n.children ?? []).map(mapNode);
      if (kids.length) item.children = kids;

      return item;
    };

    return (nodes ?? []).map(mapNode);
  }

  private toMenuUsr(nodes: SidebarNode[]): MenuUsrItem[] {
    const map: (n: SidebarNode) => MenuUsrItem = (n) => ({
      text: (n.name ?? '').trim(),
      link: n.link || undefined,
      icon: n.icon,
      submenu: (n.children ?? []).map(map),
    });
    return nodes.map(map);
  }
}
