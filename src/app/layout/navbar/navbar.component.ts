import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
} from '@angular/core';
import { CommonModule, NgLocaleLocalization } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { LayoutService } from '@core/services/layout.service'; // ajusta alias/ruta si hace falta
import {
  SkinOption,
  SKIN_OPTIONS,
  ThemeService,
} from '@core/services/theme.service'; // ajusta alias/ruta si hace falta

type FixedPart = 'nav' | 'breadcrumbs' | 'headbar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, BsDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>(); // Para colapsar/expandir el sidebar
  @Output() toggleSidebarHidden = new EventEmitter<void>(); // Para ocultar el sidebar

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

  // Lecturas (métodos o computed)
  isNavFixed() {
    return this.layout.isFixed('nav');
  }
  isBreadcrumbsFixed() {
    return this.layout.isFixed('breadcrumbs');
  }
  isHeadbarFixed() {
    return this.layout.isFixed('headbar');
  }

  sidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());

  /**
   * Oculta el sidebar (colapsado y oculto).
   * - Si está colapsado, lo expande.
   */
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
  /**
   * Mostrar / Ocultar el sidebar
   */
  onToggleSidebarHiddenClick() {
    this.toggleSidebarHidden.emit();
  }

  /** NAVBAR FIJA
   *  - Si se apaga, apaga también Breadcrumbs y Page header.
   *  - Si se enciende, sólo enciende Nav.
   */
  onToggleNavFixed() {
    const next = !this.isNavFixed();
    this.ensureFixed('nav', next);

    if (!next) {
      // al apagar nav, apaga los otros 2
      this.ensureFixed('breadcrumbs', false);
      this.ensureFixed('headbar', false);
    }
  }

  /** BREADCRUMBS FIJAS
   *  - Si se enciende, asegura Nav encendido.
   *  - Si se apaga, apaga Page header.
   */
  onToggleBreadcrumbsFixed() {
    const next = !this.isBreadcrumbsFixed();

    if (next) this.ensureFixed('nav', true); // breadcrumbs on => nav on
    this.ensureFixed('breadcrumbs', next);

    if (!next) this.ensureFixed('headbar', false); // breadcrumbs off => headbar off
  }

  /** PAGE HEADER FIJA
   *  - Si se enciende, deja encendidos Nav y Breadcrumbs.
   *  - Si se apaga, sólo se apaga ella.
   */
  onToggleHeadbarFixed() {
    const next = !this.isHeadbarFixed();

    if (next) {
      this.ensureFixed('nav', true);
      this.ensureFixed('breadcrumbs', true);
    }
    this.ensureFixed('headbar', next);
  }
}
