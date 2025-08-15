import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { LayoutService } from '@core/services/layout.service';
import {
  SkinOption,
  SKIN_OPTIONS,
  ThemeService,
} from '@core/services/theme.service';

type FixedPart = 'nav' | 'breadcrumbs' | 'headbar' | 'sidebar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, BsDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>(); // colapsar/expandir
  @Output() toggleSidebarHidden = new EventEmitter<void>(); // ocultar/mostrar

  // (lo de localStorage lo dejo intacto como lo tenías)
  isSidebarCollapsed = JSON.parse(
    localStorage.getItem('sidebarCollapsed') ?? 'false'
  );

  private layout = inject(LayoutService);
  public theme = inject(ThemeService);
  SKINS: SkinOption[] = SKIN_OPTIONS;

  // Orden de dependencia
  private readonly ORDER: FixedPart[] = [
    'nav',
    'breadcrumbs',
    'headbar',
    'sidebar',
  ];

  // ===== Lecturas =====
  isNavFixed() {
    return this.layout.isFixed('nav');
  }
  isBreadcrumbsFixed() {
    return this.layout.isFixed('breadcrumbs');
  }
  isHeadbarFixed() {
    return this.layout.isFixed('headbar');
  }
  isSidebarFixed() {
    return this.layout.isSidebarFixed();
  }

  sidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());

  // ===== Setters asegurando estado deseado =====
  private setPart(part: FixedPart, on: boolean) {
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
  private enforceTurnOn(target: FixedPart) {
    for (const part of this.ORDER) {
      this.setPart(part, true);
      if (part === target) break;
    }
  }

  /** Al apagar X, apaga X y todos sus sucesores. */
  private enforceTurnOff(target: FixedPart) {
    let hit = false;
    for (const part of this.ORDER) {
      if (part === target) hit = true;
      if (hit) this.setPart(part, false);
    }
  }

  // ===== Botones sidebar (mostrar/ocultar y colapso visual) =====
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
  onToggleSidebarHiddenClick() {
    this.toggleSidebarHidden.emit();
  }

  // ===== Toggles fijos con reglas de orden =====
  /** 1) NAVBAR */
  onToggleNavFixed() {
    const next = !this.isNavFixed();
    next ? this.enforceTurnOn('nav') : this.enforceTurnOff('nav'); // apagar navbar apaga todo
  }

  /** 2) BREADCRUMBS */
  onToggleBreadcrumbsFixed() {
    const next = !this.isBreadcrumbsFixed();
    next
      ? this.enforceTurnOn('breadcrumbs')
      : this.enforceTurnOff('breadcrumbs');
  }

  /** 3) PAGE HEADER (headbar) */
  onToggleHeadbarFixed() {
    const next = !this.isHeadbarFixed();
    next ? this.enforceTurnOn('headbar') : this.enforceTurnOff('headbar');
  }

  /** 4) SIDEBAR */
  onToggleSidebarFixed() {
    const next = !this.isSidebarFixed();
    next ? this.enforceTurnOn('sidebar') : this.enforceTurnOff('sidebar');
  }
}
