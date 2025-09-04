// src/app/layout/navbar/navbar.component.ts
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Output,
  Signal,
} from '@angular/core';
import { LayoutService } from '@core/services/layout.service';
import {
  SKIN_OPTIONS,
  SkinOption,
  ThemeService,
} from '@core/services/theme.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

type FixedPart = 'nav' | 'breadcrumbs' | 'headbar' | 'sidebar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  @Output() readonly toggleSidebar = new EventEmitter<void>(); // colapsar/expandir
  @Output() readonly toggleSidebarHidden = new EventEmitter<void>(); // ocultar/mostrar

  private readonly layout = inject(LayoutService);
  readonly theme = inject(ThemeService);
  readonly SKINS: SkinOption[] = SKIN_OPTIONS;

  // ---- lectura segura de localStorage, sin JSON.parse(any) ----
  private readSidebarCollapsed(): boolean {
    // SSR-safe
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }
    const v = localStorage.getItem('sidebarCollapsed');
    if (v === null) return false;
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;

    // fallback: intenta parsear si guardaron un boolean JSON
    try {
      const parsed: unknown = JSON.parse(v);
      return typeof parsed === 'boolean' ? parsed : false;
    } catch {
      return false;
    }
  }

  readonly isSidebarCollapsed: boolean = this.readSidebarCollapsed();

  // Orden de dependencia
  private readonly ORDER: readonly FixedPart[] = [
    'nav',
    'breadcrumbs',
    'headbar',
    'sidebar',
  ];

  // ===== Lecturas =====
  isNavFixed(): boolean {
    return this.layout.isFixed('nav');
  }
  isBreadcrumbsFixed(): boolean {
    return this.layout.isFixed('breadcrumbs');
  }
  isHeadbarFixed(): boolean {
    return this.layout.isFixed('headbar');
  }
  isSidebarFixed(): boolean {
    return this.layout.isSidebarFixed();
  }

  readonly sidebarCollapsed: Signal<boolean> = computed(() =>
    this.layout.isSidebarCollapsed(),
  );

  // ===== Setters asegurando estado deseado =====
  private setPart(part: FixedPart, on: boolean): void {
    switch (part) {
      case 'nav':
        if (this.isNavFixed() !== on) this.layout.toggleFixed('nav');
        break;
      case 'breadcrumbs':
        if (this.isBreadcrumbsFixed() !== on)
          this.layout.toggleFixed('breadcrumbs');
        break;
      case 'headbar':
        if (this.isHeadbarFixed() !== on) this.layout.toggleFixed('headbar');
        break;
      case 'sidebar':
        if (this.isSidebarFixed() !== on) this.layout.toggleSidebarFixed(on);
        break;
    }
  }

  /** Al encender X, enciende todos sus predecesores (incluyéndolo). */
  private enforceTurnOn(target: FixedPart): void {
    for (const part of this.ORDER) {
      this.setPart(part, true);
      if (part === target) break;
    }
  }

  /** Al apagar X, apaga X y todos sus sucesores. */
  private enforceTurnOff(target: FixedPart): void {
    let hit = false;
    for (const part of this.ORDER) {
      if (part === target) hit = true;
      if (hit) this.setPart(part, false);
    }
  }

  // ===== Botones sidebar (mostrar/ocultar y colapso visual) =====
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
  onToggleSidebarHiddenClick(): void {
    this.toggleSidebarHidden.emit();
  }

  // ===== Toggles fijos con reglas de orden =====
  /** 1) NAVBAR */
  onToggleNavFixed(): void {
    const next = !this.isNavFixed();
    if (next) this.enforceTurnOn('nav');
    else this.enforceTurnOff('nav'); // apagar navbar apaga todo
  }

  /** 2) BREADCRUMBS */
  onToggleBreadcrumbsFixed(): void {
    const next = !this.isBreadcrumbsFixed();
    if (next) this.enforceTurnOn('breadcrumbs');
    else this.enforceTurnOff('breadcrumbs');
  }

  /** 3) PAGE HEADER (headbar) */
  onToggleHeadbarFixed(): void {
    const next = !this.isHeadbarFixed();
    if (next) this.enforceTurnOn('headbar');
    else this.enforceTurnOff('headbar');
  }

  /** 4) SIDEBAR */
  onToggleSidebarFixed(): void {
    const next = !this.isSidebarFixed();
    if (next) this.enforceTurnOn('sidebar');
    else this.enforceTurnOff('sidebar');
  }
}
