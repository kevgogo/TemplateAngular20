// src/app/core/services/layout.service.ts
import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, NgZone, signal } from '@angular/core';
import { fromEvent, Subject, Subscription } from 'rxjs';
import { filter, map, pairwise, throttleTime } from 'rxjs/operators';

type Area = 'nav' | 'breadcrumbs' | 'headbar' | 'sidebar';

interface LayoutState {
  navFixed: boolean;
  breadcrumbsFixed: boolean;
  headbarFixed: boolean;
  sidebarCollapsed: boolean;
  sidebarFixed: boolean;
}

interface AutoCloseOnScrollOptions {
  /** Intervalo mínimo entre manejos de scroll (ms) */
  throttleMs?: number;
  /** 'any' = cualquier scroll; 'down' = solo cuando el usuario baja */
  direction?: 'any' | 'down';
  /** Delta mínima (px) para considerar que hubo scroll “real” */
  minDelta?: number;
}

const LS_KEY = 'layout-state-v1';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly doc = inject(DOCUMENT);
  private readonly state = signal<LayoutState>(this.restore());
  private readonly zone = inject(NgZone);

  // ===== evento para pedir cerrar el flypanel del sidebar =====
  private _closeSidebarPanel$ = new Subject<void>();
  /** El Sidebar se suscribe a esto para cerrar su flypanel cuando haya scroll */
  readonly closeSidebarPanel$ = this._closeSidebarPanel$.asObservable();
  /** Para disparar manualmente el cierre (si lo necesitas) */
  requestCloseSidebarPanel() {
    this._closeSidebarPanel$.next();
  }

  // suscripción al scroll global/elemento
  private scrollSub?: Subscription;

  constructor() {
    // Aplica clases al <body> y persiste cambios ante cualquier modificación del estado
    effect(() => {
      this.applyToDOM();
      this.persist();
    });
  }

  // ===== Getters (para templates/componentes) =====
  isFixed(area: Area) {
    return this.state()[`${area}Fixed` as const];
  }
  isSidebarCollapsed() {
    return this.state().sidebarCollapsed;
  }
  isSidebarFixed() {
    return this.state().sidebarFixed;
  }

  // ===== Mutadores (toggles/sets) =====
  toggleFixed(area: Area, force?: boolean) {
    this.state.update(
      (s) =>
        ({
          ...s,
          [`${area}Fixed`]: force ?? !s[`${area}Fixed` as const],
        }) as LayoutState,
    );
  }

  toggleSidebarCollapsed(force?: boolean) {
    this.state.update((s) => ({
      ...s,
      sidebarCollapsed: force ?? !s.sidebarCollapsed,
    }));
  }
  setSidebarCollapsed(value: boolean) {
    this.state.update((s) => ({ ...s, sidebarCollapsed: !!value }));
  }

  toggleSidebarFixed(force?: boolean) {
    this.state.update((s) => ({
      ...s,
      sidebarFixed: force ?? !s.sidebarFixed,
    }));
  }
  setSidebarFixed(value: boolean) {
    this.state.update((s) => ({ ...s, sidebarFixed: !!value }));
  }

  // ===== Interno: DOM + persistencia =====
  private applyToDOM() {
    const b = this.doc.body.classList;
    const s = this.state();

    // MUY IMPORTANTE: coincidir con styles.scss
    this.toggleClass(b, 'nav-fixed', s.navFixed); // <- antes estaba 'fixed-nav'
    this.toggleClass(b, 'fixed-breadcrumbs', s.breadcrumbsFixed);
    this.toggleClass(b, 'fixed-pageheader', s.headbarFixed);
    this.toggleClass(b, 'sidebar-collapsed', s.sidebarCollapsed);
    this.toggleClass(b, 'sidebar-fixed', s.sidebarFixed);
  }

  private persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.state()));
    } catch {
      /* no-op */
    }
  }

  private restore(): LayoutState {
    const defaults: LayoutState = {
      navFixed: false,
      breadcrumbsFixed: false,
      headbarFixed: false,
      sidebarCollapsed: false,
      sidebarFixed: false,
    };
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaults;
      const p = JSON.parse(raw) as Partial<LayoutState>;
      return {
        navFixed: !!p.navFixed,
        breadcrumbsFixed: !!p.breadcrumbsFixed,
        headbarFixed: !!p.headbarFixed,
        sidebarCollapsed: !!p.sidebarCollapsed,
        sidebarFixed: !!p.sidebarFixed,
      };
    } catch {
      return defaults;
    }
  }

  private toggleClass(list: DOMTokenList, cls: string, on: boolean) {
    if (on) list.add(cls);
    else list.remove(cls);
  }

  // ===== Autocierre del sidebar/flypanel al scrollear =====

  /** Activa el cierre automático del flypanel al hacer scroll en window/body */
  enableAutoCloseOnScroll(opts: AutoCloseOnScrollOptions = {}): void {
    if (this.scrollSub) return; // ya activo
    const { throttleMs = 150, direction = 'any', minDelta = 4 } = opts;
    const win = this.doc.defaultView ?? window;

    this.zone.runOutsideAngular(() => {
      this.scrollSub = fromEvent(win, 'scroll', { passive: true })
        .pipe(
          throttleTime(throttleMs, undefined, { trailing: true }),
          map(() => win.scrollY || 0),
          pairwise(),
          filter(([prev, curr]) => Math.abs(curr - prev) >= minDelta),
          filter(([prev, curr]) => (direction === 'any' ? true : curr > prev)), // 'down' => solo al bajar
        )
        .subscribe(() => {
          this.zone.run(() => this._closeSidebarPanel$.next());
        });
    });
  }

  /** Desactiva el cierre automático por scroll global */
  disableAutoCloseOnScroll(): void {
    this.scrollSub?.unsubscribe();
    this.scrollSub = undefined;
  }

  /** Variante para escuchar el scroll de un contenedor específico (opcional) */
  enableAutoCloseOnElement(
    el: HTMLElement,
    opts: AutoCloseOnScrollOptions = {},
  ): Subscription {
    const { throttleMs = 150, direction = 'any', minDelta = 4 } = opts;
    let sub!: Subscription;
    this.zone.runOutsideAngular(() => {
      sub = fromEvent(el, 'scroll', { passive: true })
        .pipe(
          throttleTime(throttleMs, undefined, { trailing: true }),
          map(() => el.scrollTop || 0),
          pairwise(),
          filter(([a, b]) => Math.abs(b - a) >= minDelta),
          filter(([a, b]) => (direction === 'any' ? true : b > a)),
        )
        .subscribe(() => {
          this.zone.run(() => this._closeSidebarPanel$.next());
        });
    });
    return sub;
  }
}
