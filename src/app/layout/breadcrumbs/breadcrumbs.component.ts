import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterModule,
  NavigationEnd,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

type BreadcrumbValue = string | ((route: ActivatedRouteSnapshot) => string);

export interface Crumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbsComponent {
  private router = inject(Router);

  private _crumbs = signal<Crumb[]>([]);
  readonly crumbs = computed(() => this._crumbs());

  constructor() {
    const build = () => {
      const rootSnap = this.router.routerState.snapshot.root;
      const list = this.prependHome(this.buildFromSnapshot(rootSnap));
      this._crumbs.set(list);
    };

    // Recalcular en cada navegación "estable"
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(build);
    // Y una vez al iniciar
    build();
  }

  // ===== Core =====
  private buildFromSnapshot(
    snap: ActivatedRouteSnapshot | null,
    url: string = '',
    acc: Crumb[] = []
  ): Crumb[] {
    if (!snap) return acc;

    const cfg = snap.routeConfig ?? undefined;

    // Agregar segmento real de la URL (ya resuelto con params)
    if (cfg?.path) {
      const segment = this.segmentFromSnapshot(snap);
      if (segment) url += `/${segment}`;
    }

    // Metadata de la ruta
    const data = (snap.data || {}) as {
      breadcrumb?: BreadcrumbValue;
      breadcrumbSkip?: boolean;
    };

    if (!data.breadcrumbSkip) {
      const label =
        this.resolveBreadcrumb(data.breadcrumb, snap) ??
        this.fallbackLabel(snap);
      if (label) acc.push({ label, url: url || '/' });
    }

    return this.buildFromSnapshot(snap.firstChild, url, acc);
  }

  private prependHome(crumbs: Crumb[]): Crumb[] {
    return crumbs.length && crumbs[0].url === '/'
      ? crumbs
      : [{ label: 'Home', url: '/' }, ...crumbs];
  }

  private segmentFromSnapshot(snap: ActivatedRouteSnapshot): string {
    // Usa los segmentos ya resueltos (sin :params)
    return snap.url.map((u) => u.path).join('/');
  }

  private resolveBreadcrumb(
    bc: BreadcrumbValue | undefined,
    snap: ActivatedRouteSnapshot
  ): string | null {
    if (!bc) return null;
    return typeof bc === 'string' ? bc : bc(snap);
  }

  private fallbackLabel(snap: ActivatedRouteSnapshot): string | null {
    const cfg = snap.routeConfig;
    if (!cfg || !cfg.path || cfg.path === '**') return null;

    // Reemplazar :param por valor real en el path
    let label = cfg.path;
    for (const [k, v] of Object.entries(snap.params ?? {})) {
      label = label.replace(`:${k}`, String(v));
    }
    return label.replace(/-/g, ' ').trim();
  }
}
