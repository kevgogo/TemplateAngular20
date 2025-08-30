// src/app/layout/shell/shell.component.ts
import {
  Component,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
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

  // Menú en el shape ACTUAL (text/submenu)
  menuItems = toSignal(this.menu.getSidebarItems$(), { initialValue: [] });

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
    return false;
  }

  // >>>>>>>>>>>>> NUEVO <<<<<<<<<<<<<<
  ngOnInit(): void {
    // Cierra el flypanel del sidebar al scrollear el window/body
    this.layout.enableAutoCloseOnScroll({ throttleMs: 150, direction: 'any' });
  }
  ngOnDestroy(): void {
    this.layout.disableAutoCloseOnScroll();
  }
}
