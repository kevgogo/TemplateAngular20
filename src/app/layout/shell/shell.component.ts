import {
  Component,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LayoutService } from '@core/services/layout.service';
import { LAYOUT_IMPORTS } from '@layout/layout.imports';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [LAYOUT_IMPORTS, SHARED_IMPORTS],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private layout = inject(LayoutService);

  collapsed = computed(() => this.layout.isSidebarCollapsed());
  sidebarHidden = signal(false);

  onToggleSidebar() {
    this.layout.toggleSidebarCollapsed();
  }

  onToggleSidebarHidden() {
    this.sidebarHidden.update((v) => !v);
  }

  // Conecta con tu LayoutService o flags existentes:
  get isCompact() {
    return this.layout.isSidebarCollapsed?.() ?? false;
  }
  get isFixed() {
    // return this.layout.isFixed() ?? false;
    return false;
  }
}
