// src/app/features/demo/devextreme/treeview-demo.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTreeViewModule } from 'devextreme-angular';
import { DEMO_MENU } from '@shared/mock/fake-menu';

interface TreeItem {
  id: string;
  text: string;
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
    this.items = (DEMO_MENU ?? []).map((n, idx) =>
      this.toTree(n, `root-${idx}`)
    );
  }

  private toTree(node: any, id: string): TreeItem {
    return {
      id,
      text: node.label,
      expanded: true,
      items: (node.children ?? []).map((ch: any, i: number) =>
        this.toTree(ch, `${id}-${i}`)
      ),
    };
  }
}
