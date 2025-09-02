import { RawMenuItem, SidebarNode } from '@core/models/menu.types';

export interface BuildTreeOptions {
  baseHref?: string;
  filterStatus?: number | null;
  allowedPermissions?: Set<string> | string[];
}

export function buildSidebarTree(
  items: RawMenuItem[],
  opts: BuildTreeOptions = {},
): SidebarNode[] {
  const baseHref = opts.baseHref ?? '';
  const filterStatus = opts.filterStatus ?? 1;

  const permSet: Set<string> | undefined = Array.isArray(
    opts.allowedPermissions,
  )
    ? new Set(opts.allowedPermissions)
    : opts.allowedPermissions instanceof Set
      ? opts.allowedPermissions
      : undefined;

  const filtered = items.filter((it) => {
    const statusOk = filterStatus == null || it.status === filterStatus;

    const permOk =
      !permSet || !it.permission || permSet.has(it.permission.trim());

    return statusOk && permOk;
  });

  const map = new Map<number, SidebarNode>();
  for (const it of filtered) {
    const node: SidebarNode = {
      ...it,
      key: it.id,
      text: (it.nameSpanish ?? it.name ?? '').trim(),
      link: computeLink(it, baseHref),
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

  const sortRec = (arr: SidebarNode[]): void => {
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

function computeLink(it: RawMenuItem, baseHref = ''): string | null {
  const p = (it.path ?? '').trim();
  if (p) return ensureAbs(joinUrl(baseHref, p));

  const c = (it.controller ?? '').trim();
  const a = (it.action ?? '').trim();
  const segments = [c, a].filter(Boolean);

  return segments.length ? ensureAbs(joinUrl(baseHref, ...segments)) : null;
}

function joinUrl(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((s, i) =>
      i === 0 ? s.replace(/\/+$/g, '') : s.replace(/^\/+|\/+$/g, ''),
    )
    .join('/')
    .replace(/\/{2,}/g, '/');
}

function ensureAbs(url: string): string {
  return url.startsWith('/') ? url : `/${url}`;
}
