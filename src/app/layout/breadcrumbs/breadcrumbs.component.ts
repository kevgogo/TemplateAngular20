import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuService } from '@core/services/menu.service';
import { SidebarNode } from '@core/models/menu.types';

interface Crumb { label: string; url: string }

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  private router = inject(Router);
  private menu = inject(MenuService);

  // Estado
  private currentUrl = signal(this.cleanUrl(this.router.url));
  private routeTrail = signal<{ url: string; label?: string }[]>([]);
  private menuTree = signal<SidebarNode[]>([]);

  constructor() {
    // Reconstruir trail en cada navegación (root del router para evitar undefined)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl.set(this.cleanUrl(this.router.url));
        const root = this.router.routerState.root;
        this.routeTrail.set(this.buildRouteTrail(root));
      });

    // Primera evaluación
    const root = this.router.routerState.root;
    this.routeTrail.set(this.buildRouteTrail(root));

    // Árbol del sidebar (mismos rótulos que ves en el menú)
    this.menu
      .getSidebarItems$()
      .subscribe((nodes) => this.menuTree.set(nodes ?? []));
  }

  // Crumbs: Menú → Rutas → Slug (excluye el "Inicio" porque ya se dibuja fijo en el HTML)
  readonly crumbs = computed<Crumb[]>(() => {
    const trail = this.routeTrail();
    const labelMap = this.buildMenuLabelMap(this.menuTree());

    const list: Crumb[] = [];
    for (const step of trail) {
      const normUrl = this.norm(step.url);
      // Evita duplicar Home/Inicio: se renderiza fijo
      if (normUrl === '/home') continue;

      const labelFromMenu = labelMap.get(normUrl);
      const label =
        this.pickLabel(
          labelFromMenu,
          step.label,
          this.slugToTitle(this.last(normUrl)),
        ) || '';

      // Filtra vacíos y Home/Inicio residuales
      const low = label.toLowerCase();
      if (!label || low === 'home' || low === 'inicio') continue;

      list.push({ label, url: normUrl });
    }

    // Dedup contiguos por seguridad
    return list.filter((c, i, arr) => i === 0 || c.label !== arr[i - 1].label);
  });

  // —— helpers —— //

  private buildRouteTrail(
    ar: ActivatedRoute | null | undefined,
    base = '',
  ): { url: string; label?: string }[] {
    if (!ar) return [];

    const out: { url: string; label?: string }[] = [];

    const snap = ar.snapshot;
    const seg = (snap?.url ?? [])
      .map((s) => s.path)
      .filter(Boolean)
      .join('/');
    const url = this.norm(seg ? `${base}/${seg}` : base || '/');

    // Lee en orden: data.breadcrumb > data.title > routeConfig.title
    const label = this.getRouteTitle(snap);

    // Empuja si hay segmento **o** si hay un título (soporta path:'')
    if (seg || label) out.push({ url, label });

    for (const ch of ar.children ?? []) {
      out.push(...this.buildRouteTrail(ch, url));
    }
    return out;
  }

  private getRouteTitle(snap?: ActivatedRouteSnapshot): string | undefined {
    const fromData =
      (snap?.data?.['breadcrumb'] as string | undefined) ??
      (snap?.data?.['title'] as string | undefined);

    // routeConfig.title puede ser string o función; aquí solo usamos string
    const fromRouteConfig =
      typeof snap?.routeConfig?.title === 'string'
        ? (snap.routeConfig.title)
        : undefined;

    return fromData ?? fromRouteConfig;
  }

  private buildMenuLabelMap(tree: SidebarNode[]): Map<string, string> {
    const map = new Map<string, string>();
    const dfs = (n: SidebarNode) => {
      const link = n.link ? this.norm(n.link) : null;
      const label = (n.text ?? n.name ?? '').trim();
      if (link && label) map.set(link, label);
      for (const c of n.children ?? []) dfs(c);
    };
    for (const r of tree) dfs(r);
    return map;
  }

  private pickLabel(...candidates: (string | undefined)[]) {
    return candidates.find((v) => !!v && v.trim().length > 0)?.trim() ?? '';
  }

  private slugToTitle(s: string) {
    return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  private last(url: string) {
    const p = url.split('/').filter(Boolean);
    return p[p.length - 1] ?? '';
  }

  private norm(u: string) {
    return (u || '/').replace(/\/+$/g, '') || '/';
  }

  private cleanUrl(u: string) {
    return u.split('?')[0].split('#')[0] || '/';
  }
}
