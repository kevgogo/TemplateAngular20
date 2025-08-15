import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@core/services/layout.service';
import { MENU_DATA } from '@shared/mock/menu';

export interface MenuNode {
  label: string;
  link?: string | any[] | null;
  icon?: string;
  /** Puede venir vacío: [] -> se normaliza a undefined */
  children?: MenuNode[] | null;
}

@Component({
  selector: 'app-sidebar-legacy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-legacy.component.html',
  styleUrls: ['./sidebar-legacy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarLegacyComponent {
  /** Override opcional. Si no se provee, se usa el estado del LayoutService */
  @Input() collapsed: boolean | null = null;

  /** Menú (normalizado internamente) */
  @Input() set items(value: MenuNode[]) {
    this._items = this.normalize(value ?? []);
  }
  get items(): MenuNode[] {
    return this._items;
  }
  private _items: MenuNode[] = MENU_DATA;

  private layout = inject(LayoutService);
  private host = inject(ElementRef<HTMLElement>);

  /** Estado real resuelto (Input ?? servicio) */
  get collapsedResolved(): boolean {
    return this.collapsed ?? this.layout.isSidebarCollapsed();
  }

  /* ------------------ Normalización + helper ------------------ */

  /** Convierte children: [] en undefined y normaliza recursivamente */
  private normalize(nodes: MenuNode[]): MenuNode[] {
    return (nodes ?? []).map((n) => {
      const copy: MenuNode = { ...n };
      const kids = Array.isArray(n.children) ? n.children.filter(Boolean) : [];
      copy.children = kids.length ? this.normalize(kids) : undefined;
      return copy;
    });
  }

  /** Verdadero si el nodo tiene hijos NO vacíos */
  hasChildren = (n?: MenuNode | null): boolean =>
    !!n && Array.isArray(n.children) && n.children.length > 0;

  /* ------------------ Expandido (inline) ------------------ */

  private openSet = new Set<string>();
  nodeId(parentId: string | null, index: number): string {
    return parentId ? `${parentId}.${index}` : String(index);
  }
  isOpen(id: string): boolean {
    return this.openSet.has(id);
  }
  toggle(id: string): void {
    if (this.openSet.has(id)) this.openSet.delete(id);
    else this.openSet.add(id);
  }

  /** Click en item raíz (comporta distinto según modo) */
  onRootClick(ev: MouseEvent, node: MenuNode, rootIndex: number): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (this.collapsedResolved) {
        // Colapsado: abrir/cerrar panel único
        if (this.panelOpenRootIndex === rootIndex) this.closePanel();
        else
          this.openPanelForRoot(
            ev.currentTarget as HTMLElement,
            node,
            rootIndex
          );
      } else {
        // Expandido: inline toggle
        this.toggle(this.nodeId(null, rootIndex));
      }
      return;
    }
    // Sin hijos: deja navegar
    if (this.collapsedResolved) this.closePanel();
  }

  /** Click en item no raíz (expandido, inline) */
  onItemClick(ev: MouseEvent, node: MenuNode, id: string): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (!this.collapsedResolved) this.toggle(id);
    }
  }

  /* ------------------ Colapsado: panel único con drilldown ------------------ */

  panelOpenRootIndex: number | null = null;
  panelStack: MenuNode[] = []; // ruta actual (root -> ... -> nodo actual)
  panelStyle: Record<string, string> = {}; // posición del panel

  get panelNodes(): MenuNode[] {
    const current = this.panelStack[this.panelStack.length - 1];
    return (current?.children ?? []) as MenuNode[];
  }
  get canGoBack(): boolean {
    return this.panelStack.length > 1;
  }
  get panelTitle(): string {
    const current = this.panelStack[this.panelStack.length - 1];
    return current?.label ?? '';
  }

  openPanelForRoot(
    anchorEl: HTMLElement,
    rootNode: MenuNode,
    rootIndex: number
  ): void {
    this.panelOpenRootIndex = rootIndex;
    this.panelStack = [rootNode];
    this.repositionPanel(anchorEl);
  }

  onPanelItemClick(ev: MouseEvent, node: MenuNode): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      this.panelStack.push(node); // drill-down en el mismo panel
    } else {
      this.closePanel(); // navegará por routerLink y cerramos
    }
  }

  panelBack(): void {
    if (this.panelStack.length > 1) this.panelStack.pop();
    else this.closePanel();
  }

  closePanel(): void {
    this.panelOpenRootIndex = null;
    this.panelStack = [];
    this.panelStyle = {};
  }

  /** Posiciona el panel al lado del sidebar, alineado al item clickeado */
  private repositionPanel(anchorEl: HTMLElement): void {
    const li = (anchorEl.closest('li.item') as HTMLElement) ?? anchorEl;
    const r = li.getBoundingClientRect();
    const aside = this.host.nativeElement.querySelector(
      'aside.sidebar'
    ) as HTMLElement;
    const a = aside.getBoundingClientRect();

    const maxTop = Math.max(8, Math.min(r.top, window.innerHeight - 16 - 320));
    this.panelStyle = {
      position: 'fixed',
      top: `${Math.round(maxTop)}px`,
      left: `${Math.round(a.right)}px`,
      minWidth: '260px',
      maxHeight: 'calc(100vh - 24px)',
      overflowY: 'auto',
    };
  }

  /** Cerrar con ESC y reposicionar en resize */
  @HostListener('window:keydown.escape')
  onEsc() {
    if (this.collapsedResolved) this.closePanel();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.collapsedResolved && this.panelOpenRootIndex !== null) {
      const items =
        this.host.nativeElement.querySelectorAll('li.item > a.link');
      const anchor = items.item(this.panelOpenRootIndex) as HTMLElement;
      if (anchor) this.repositionPanel(anchor);
    }
  }
}
