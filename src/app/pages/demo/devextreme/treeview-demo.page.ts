// src/app/pages/demo/devextreme/treeview-demo.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTreeViewModule } from 'devextreme-angular';
import { DEMO_MENU } from '@shared/mock/fake-menu';
import { buildSidebarTree } from '@core/utils/menu-tree.util';

interface TreeItem {
  id: string;
  text: string; // DevExtreme usa 'text' por defecto
  expanded?: boolean;
  items?: TreeItem[];
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
    // 1) Normalizamos tu DEMO_MENU a SidebarNode[]
    const sidebarTree = buildSidebarTree(DEMO_MENU, { filterStatus: 1 });

    // 2) Lo convertimos al shape que espera DxTreeView
    this.items = sidebarTree.map((n, i) => this.toTree(n, `${i}`));
  }

  /** Acepta MenuNode (label) o SidebarNode (text) y unifica */
  private toTree(node: any, id: string): TreeItem {
    const label = (node.label ?? node.text ?? '').trim();
    const children = node.children ?? node.submenu ?? [];
    return {
      id,
      text: label || '(sin nombre)',
      expanded: true,
      items: children.map((ch: any, i: number) =>
        this.toTree(ch, `${id}-${i}`),
      ),
    };
  }
}
