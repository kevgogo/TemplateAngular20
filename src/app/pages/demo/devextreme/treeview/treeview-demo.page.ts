// src/app/pages/demo/devextreme/treeview-demo.page.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { MenuNode, SidebarNode } from '@core/models/menu.types';
import { buildSidebarTree } from '@core/utils/menu-tree.util';
import { DEMO_MENU } from '@shared/mock/fake-menu';
import { DxTreeViewModule } from 'devextreme-angular';

interface TreeItem {
  id: string;
  text: string; // DevExtreme usa 'text' por defecto
  expanded?: boolean;
  items?: TreeItem[];
}

/** Nodo “like”: acepta shapes de MenuNode (label/children) y SidebarNode (text/children) */
interface NodeLike {
  label?: unknown;
  text?: unknown;
  children?: NodeLike[];
  submenu?: NodeLike[]; // por si llega shape de SidebarItem adaptado
}

@Component({
  selector: 'app-treeview-demo',
  standalone: true,
  imports: [CommonModule, DxTreeViewModule],
  templateUrl: './treeview-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeviewDemoPage {
  items: TreeItem[] = [];

  constructor() {
    // 1) Normalizamos tu DEMO_MENU (RawMenuItem[]) a SidebarNode[]
    const sidebarTree: SidebarNode[] = buildSidebarTree(DEMO_MENU, {
      filterStatus: 1,
    });

    // 2) Lo convertimos al shape que espera DxTreeView
    this.items = sidebarTree.map((n, i) => this.toTree(n, `${i}`));
  }

  /** Acepta MenuNode (label) o SidebarNode (text) y unifica sin `any`. */
  private toTree(
    node: NodeLike | SidebarNode | MenuNode,
    id: string,
  ): TreeItem {
    const n = node as NodeLike;

    // Evita no-base-to-string: si no es string, usa vacío
    const rawLabel = n.label ?? n.text;
    const label = typeof rawLabel === 'string' ? rawLabel.trim() : '';

    // Asegura siempre un array de NodeLike[]
    const kids: NodeLike[] = Array.isArray(n.children)
      ? n.children
      : Array.isArray(n.submenu)
        ? n.submenu
        : [];

    return {
      id,
      text: label || '(sin nombre)',
      expanded: true,
      // Solo pone items si hay hijos (opcional en la interfaz)
      items: kids.length
        ? kids.map((ch, i) => this.toTree(ch, `${id}-${i}`))
        : undefined,
    };
  }
}
