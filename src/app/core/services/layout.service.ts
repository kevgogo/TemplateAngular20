// src/app/core/services/layout.service.ts
import { Injectable, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Area = 'nav' | 'breadcrumbs' | 'headbar' | 'sidebar';

type LayoutState = {
  navFixed: boolean;
  breadcrumbsFixed: boolean;
  headbarFixed: boolean;
  sidebarCollapsed: boolean;
  sidebarFixed: boolean;
};

const LS_KEY = 'layout-state-v1';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly doc = inject(DOCUMENT);
  private readonly state = signal<LayoutState>(this.restore());

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
          [`${area}Fixed`]: (force ?? !s[`${area}Fixed` as const]) as boolean,
        } as LayoutState)
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
    } catch {}
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
}
