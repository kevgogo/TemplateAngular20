// src/app/layout/shell/shell.component.ts
import { Component, inject, computed } from '@angular/core';
import { LayoutService } from '@core/services/layout.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SHARED_IMPORTS],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private layout = inject(LayoutService);

  collapsed = computed(() => this.layout.isSidebarCollapsed());

  onToggleSidebar() {
    this.layout.toggleSidebarCollapsed();
  }
}
