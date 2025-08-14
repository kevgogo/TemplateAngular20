import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { LayoutService } from '@core/services/layout.service'; // ajusta alias/ruta si hace falta
import {
  SkinOption,
  SKIN_OPTIONS,
  ThemeService,
} from '@core/services/theme.service'; // ajusta alias/ruta si hace falta

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, BsDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  private layout = inject(LayoutService);
  public theme = inject(ThemeService);
  SKINS: SkinOption[] = SKIN_OPTIONS;

  // Lecturas (métodos o computed)
  navFixed() {
    return this.layout.isFixed('nav');
  }
  breadcrumbsFixed() {
    return this.layout.isFixed('breadcrumbs');
  }
  headbarFixed() {
    return this.layout.isFixed('headbar');
  }

  sidebarCollapsed = computed(() => this.layout.isSidebarCollapsed());

  // Acciones
  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
  onToggleNavFixed() {
    this.layout.toggleFixed('nav');
  }
  onToggleBreadcrumbsFixed() {
    this.layout.toggleFixed('breadcrumbs');
  }
  onToggleHeadbarFixed() {
    this.layout.toggleFixed('headbar');
  }
}
