import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  HostListener,
  ElementRef,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  /** Override opcional. Si no se provee, se usa el estado del LayoutService */
  @Input() collapsed: boolean | null = null;

  /** Menú (normalizado internamente) */
  @Input() set items(value: MenuNode[]) {
    this._originalItems = this.normalize(value ?? []);
    this.searchTerm.set(''); // Reset búsqueda cuando cambian los items
  }
  get items(): MenuNode[] {
    return this.filteredItems();
  }
  private _originalItems: MenuNode[] = MENU_DATA;

  private layout = inject(LayoutService);
  private host = inject(ElementRef<HTMLElement>);

  // Señales para la búsqueda
  searchTerm = signal('');
  isSearching = computed(() => this.searchTerm().trim().length > 0);

  /** Estado real resuelto (Input ?? servicio) */
  get collapsedResolved(): boolean {
    return this.collapsed ?? this.layout.isSidebarCollapsed();
  }

  /* ------------------ Búsqueda ------------------ */

  /** Items filtrados basados en el término de búsqueda */
  private filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this._originalItems;

    return this.filterMenuItems(this._originalItems, term);
  });

  /** Filtra recursivamente los items del menú */
  private filterMenuItems(items: MenuNode[], searchTerm: string): MenuNode[] {
    const filtered: MenuNode[] = [];

    for (const item of items) {
      // Verificar si el item actual coincide
      const matchesItem = item.label.toLowerCase().includes(searchTerm);

      // Filtrar hijos recursivamente
      let filteredChildren: MenuNode[] | undefined;
      if (item.children) {
        filteredChildren = this.filterMenuItems(item.children, searchTerm);
      }

      // Incluir el item si:
      // 1. El item coincide con la búsqueda, O
      // 2. Tiene hijos que coinciden con la búsqueda
      if (matchesItem || (filteredChildren && filteredChildren.length > 0)) {
        const filteredItem: MenuNode = {
          ...item,
          children: filteredChildren?.length ? filteredChildren : undefined,
        };
        filtered.push(filteredItem);
      }
    }

    return filtered;
  }

  /** Maneja el cambio en el input de búsqueda */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);

    // Auto-expandir resultados cuando hay búsqueda activa
    if (this.isSearching() && !this.collapsedResolved) {
      this.expandAllForSearch();
    }
  }

  /** Limpia la búsqueda */
  clearSearch(): void {
    this.searchTerm.set('');
    this.collapseAllAfterSearch();
  }

  /** Expande todos los nodos que tienen resultados de búsqueda */
  private expandAllForSearch(): void {
    this.openSet.clear();
    this.addOpenNodesRecursively(this.filteredItems(), null);
  }

  /** Añade nodos abiertos recursivamente para mostrar resultados de búsqueda */
  private addOpenNodesRecursively(
    nodes: MenuNode[],
    parentId: string | null
  ): void {
    nodes.forEach((node, index) => {
      const nodeIdStr = this.nodeId(parentId, index);
      if (this.hasChildren(node)) {
        this.openSet.add(nodeIdStr);
        this.addOpenNodesRecursively(node.children!, nodeIdStr);
      }
    });
  }

  /** Colapsa todos los nodos después de limpiar la búsqueda */
  private collapseAllAfterSearch(): void {
    this.openSet.clear();
  }

  /** Resalta el término de búsqueda en el texto */
  highlightSearchTerm(text: string, term: string): string {
    if (!term.trim()) return text;

    const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /** Escapa caracteres especiales para regex */
  /** Colapsa todos los nodos después de limpiar la búsqueda */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '');
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

    // Limpiar búsqueda al navegar
    if (this.isSearching()) {
      this.clearSearch();
    }
  }

  /** Click en item no raíz (expandido, inline) */
  onItemClick(ev: MouseEvent, node: MenuNode, id: string): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (!this.collapsedResolved) this.toggle(id);
    } else {
      // Limpiar búsqueda al navegar
      if (this.isSearching()) {
        this.clearSearch();
      }
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

      // Limpiar búsqueda al navegar
      if (this.isSearching()) {
        this.clearSearch();
      }
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
    else if (this.isSearching()) this.clearSearch();
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
