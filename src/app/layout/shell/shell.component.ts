// src/app/layout/shell/shell.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { LayoutService } from '@core/services/layout.service';
import { MenuService } from '@core/services/menu.service';
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
export class ShellComponent implements OnInit, OnDestroy {
  private layout = inject(LayoutService);
  private menu = inject(MenuService);

  menuItems = toSignal(this.menu.getSidebarItems$(), { initialValue: [] });

  collapsed = computed(() => this.layout.isSidebarCollapsed());
  sidebarHidden = signal(false);

  onToggleSidebar() {
    this.layout.toggleSidebarCollapsed();
  }

  onToggleSidebarHidden() {
    this.sidebarHidden.update((v) => !v);
  }

  get isCompact() {
    return this.layout.isSidebarCollapsed?.() ?? false;
  }

  ngOnInit(): void {
    this.layout.enableAutoCloseOnScroll({ throttleMs: 150, direction: 'any' });
  }
  ngOnDestroy(): void {
    this.layout.disableAutoCloseOnScroll();
  }
}
