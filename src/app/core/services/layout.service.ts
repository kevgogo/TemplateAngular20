// src/app/core/services/layout.service.ts
import { Injectable, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type LayoutState = {
  navFixed: boolean;
  breadcrumbsFixed: boolean;
  headbarFixed: boolean;
  sidebarCollapsed: boolean;
};

const LS_KEY = 'layout-state-v1';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private doc = inject(DOCUMENT);
  private state = signal<LayoutState>(this.restore());

  constructor() {
    // Aplica clases al <body> cada vez que cambia el estado
    effect(() => {
      this.applyToDOM();
      this.persist();
    });
  }

  // ===== Lecturas (para templates) =====
  isFixed(area: 'nav' | 'breadcrumbs' | 'headbar') {
    return this.state()[`${area}Fixed` as const];
  }
  isSidebarCollapsed() {
    return this.state().sidebarCollapsed;
  }

  // ===== Mutaciones (desde UI) =====
  toggleFixed(area: 'nav' | 'breadcrumbs' | 'headbar') {
    const key = `${area}Fixed` as const;
    this.state.update((s) => ({ ...s, [key]: !s[key] }));
  }
  setFixed(area: 'nav' | 'breadcrumbs' | 'headbar', value: boolean) {
    const key = `${area}Fixed` as const;
    this.state.update((s) => ({ ...s, [key]: !!value }));
  }
  toggleSidebarCollapsed(force?: boolean) {
    this.state.update((s) => ({
      ...s,
      sidebarCollapsed: force ?? !s.sidebarCollapsed,
    }));
  }

  // ===== Interno: DOM + persistencia =====
  private applyToDOM() {
    const b = this.doc.body.classList;
    const s = this.state();
    this.toggleClass(b, 'fixed-nav', s.navFixed);
    this.toggleClass(b, 'fixed-breadcrumbs', s.breadcrumbsFixed);
    this.toggleClass(b, 'fixed-pageheader', s.headbarFixed);
    this.toggleClass(b, 'sidebar-collapsed', s.sidebarCollapsed);
  }

  private persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.state()));
    } catch {}
  }

  private restore(): LayoutState {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as LayoutState;
    } catch {}
    return {
      navFixed: false,
      breadcrumbsFixed: false,
      headbarFixed: false,
      sidebarCollapsed: false,
    };
  }

  private toggleClass(list: DOMTokenList, cls: string, on: boolean) {
    if (on) list.add(cls);
    else list.remove(cls);
  }
}
