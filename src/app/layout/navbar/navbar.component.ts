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

type FixedPart = 'nav' | 'breadcrumbs' | 'headbar';

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

  /** Cambia el estado sólo si hace falta */
  private ensureFixed(part: FixedPart, on: boolean) {
    if (part === 'nav' && this.isNavFixed() !== on)
      this.layout.toggleFixed('nav');
    if (part === 'breadcrumbs' && this.isBreadcrumbsFixed() !== on)
      this.layout.toggleFixed('breadcrumbs');
    if (part === 'headbar' && this.isHeadbarFixed() !== on)
      this.layout.toggleFixed('headbar');
  }

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
  } // <- FALTABA

  sidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());

  // ===== Botones sidebar =====
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
  onToggleSidebarHiddenClick() {
    this.toggleSidebarHidden.emit();
  }

  // ===== Toggles fijos =====
  /** NAVBAR FIJA */
  onToggleNavFixed() {
    const next = !this.isNavFixed();
    this.ensureFixed('nav', next);
    if (!next) {
      this.ensureFixed('breadcrumbs', false);
      this.ensureFixed('headbar', false);
    }
  }

  /** BREADCRUMBS FIJAS */
  onToggleBreadcrumbsFixed() {
    const next = !this.isBreadcrumbsFixed();
    if (next) this.ensureFixed('nav', true); // breadcrumbs on => nav on
    this.ensureFixed('breadcrumbs', next);
    if (!next) this.ensureFixed('headbar', false); // breadcrumbs off => headbar off
  }

  /** PAGE HEADER FIJA */
  onToggleHeadbarFixed() {
    const next = !this.isHeadbarFixed();
    if (next) {
      this.ensureFixed('nav', true);
      this.ensureFixed('breadcrumbs', true);
    }
    this.ensureFixed('headbar', next);
  }

  /** SIDEBAR FIJA (solo afecta al sidebar) */
  onToggleSidebarFixed() {
    const next = !this.isSidebarFixed();
    if (next) {
      // Al fijar el sidebar, garantizamos la jerarquía fija para que los offsets funcionen bien
      this.ensureFixed('nav', true);
      this.ensureFixed('breadcrumbs', true);
      this.ensureFixed('headbar', true);
    }
    this.layout.toggleSidebarFixed(next);
  }
}
