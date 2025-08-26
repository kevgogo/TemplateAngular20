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
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '@core/services/layout.service';
import { MENU_DATA } from '@shared/mock/menu';
import {
  AnyItem,
  MenuNode,
  SidebarItem,
  RouteLink,
} from '@core/models/menu.types';

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

  /** Menú (acepta MenuNode[] o SidebarItem[] y lo normaliza a MenuNode[]) */
  @Input() set items(value: AnyItem[]) {
    const coerced = this.coerceToMenuNodes(value ?? []);
    this._originalItems = this.normalize(coerced);
    this.searchTerm.set(''); // reset búsqueda
    this.resetListPreservingSelection(); // abre ancestros del activo
  }
  get items(): MenuNode[] {
    return this.filteredItems();
  }

  /** Fallback local (mock) también convertido al vuelo */
  private _originalItems: MenuNode[] = this.normalize(
    this.coerceToMenuNodes(MENU_DATA as any)
  );

  private layout = inject(LayoutService);
  private host = inject(ElementRef<HTMLElement>);
  private router = inject(Router);

  // ------------------ Búsqueda (signals) ------------------
  searchTerm = signal('');
  isSearching = computed(() => this.searchTerm().trim().length > 0);

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
      const matchesItem = item.label.toLowerCase().includes(searchTerm);

      let filteredChildren: MenuNode[] | undefined;
      if (item.children) {
        filteredChildren = this.filterMenuItems(item.children, searchTerm);
      }

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

  /** Maneja el cambio en el input de búsqueda (desde el template) */
  onSearchChange(value: string): void {
    this.searchTerm.set(value);

    if (!this.isSearching()) {
      // si quedó vacío, resetea preservando selección
      this.resetListPreservingSelection();
      return;
    }

    // Auto-expandir resultados cuando hay búsqueda activa
    if (!this.collapsedResolved) {
      this.expandAllForSearch();
    }
  }

  /** Limpia la búsqueda (botón X o navegación) */
  clearSearch(): void {
    this.searchTerm.set('');
    this.resetListPreservingSelection();
  }

  /** Expande todos los nodos que tienen resultados de búsqueda */
  private expandAllForSearch(): void {
    this.openSet.clear();
    this.forcedOpen.clear(); // cuando se busca, solo abrimos por resultados
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

  /** Resalta el término de búsqueda en el texto */
  highlightSearchTerm(text: string, term: string): string {
    const t = term.trim();
    if (!t) return text;
    const regex = new RegExp(`(${this.escapeRegex(t)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /** Escapa caracteres especiales para regex */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ------------------ Normalización + helpers ------------------
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

  /** Estado real resuelto (Input ?? servicio) */
  get collapsedResolved(): boolean {
    return this.collapsed ?? this.layout.isSidebarCollapsed();
  }

  // ------------------ Expandido (inline) ------------------
  private openSet = new Set<string>(); // aperturas del usuario / búsqueda
  private forcedOpen = new Set<string>(); // aperturas forzadas (ancestros del activo)

  nodeId(parentId: string | null, index: number): string {
    return parentId ? `${parentId}.${index}` : String(index);
  }

  isOpen(id: string): boolean {
    // Unión: abiertas por usuario/búsqueda ∪ abiertas por ruta activa
    return this.openSet.has(id) || this.forcedOpen.has(id);
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
    if (this.isSearching()) this.clearSearch();
  }

  /** Click en item no raíz (expandido, inline) */
  onItemClick(ev: MouseEvent, node: MenuNode, id: string): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (!this.collapsedResolved) this.toggle(id);
    } else {
      if (this.isSearching()) this.clearSearch();
    }
  }

  // ------------------ Colapsado: panel único con drilldown ------------------
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
      if (this.isSearching()) this.clearSearch();
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

  // ------------------ Reset + mantener selección ------------------
  private resetListPreservingSelection() {
    // Mostrar árbol original (al dejar el término vacío)
    this.openSet.clear();
    this.forcedOpen.clear();

    const path = this.findActiveIndexPath(this._originalItems);
    if (path) this.openIndexPath(path); // abre los ancestros
  }

  private openIndexPath(path: number[]) {
    let pid: string | null = null;
    for (const idx of path.slice(0, -1)) {
      // solo ancestros
      pid = this.nodeId(pid, idx);
      this.forcedOpen.add(pid);
    }
  }

  private findActiveIndexPath(
    nodes: MenuNode[],
    trail: number[] = []
  ): number[] | null {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const here = [...trail, i];

      if (this.isItemActive(n)) return here;
      if (n.children?.length) {
        const found = this.findActiveIndexPath(n.children, here);
        if (found) return found;
      }
    }
    return null;
  }

  private isItemActive(n: MenuNode): boolean {
    if (!n.link) return false;
    const current = this.router.url.split('?')[0];
    const toUrl = Array.isArray(n.link)
      ? '/' + n.link.filter(Boolean).join('/')
      : String(n.link);
    return current === toUrl;
  }

  // ================== CONVERSIÓN SidebarItem -> MenuNode ==================

  /** ¿Es SidebarItem (legacy)? */
  private isSidebarItem(o: any): o is SidebarItem {
    return !!o && 'text' in o && !('label' in o);
  }

  /** Convierte SidebarItem[] | MenuNode[] a MenuNode[] */
  private coerceToMenuNodes(items: AnyItem[]): MenuNode[] {
    const mapOne = (it: AnyItem): MenuNode => {
      if (this.isSidebarItem(it)) {
        const kids = (it.submenu ?? undefined) as AnyItem[] | undefined;
        return {
          label: it.text,
          link: it.link ?? undefined,
          icon: it.icon ?? undefined,
          children: kids?.length ? kids.map(mapOne) : undefined,
        };
      }
      // ya es MenuNode
      return {
        label: it.label,
        link: it.link,
        icon: it.icon,
        children: it.children?.length ? it.children.map(mapOne) : undefined,
      };
    };
    return (items ?? []).map(mapOne);
  }
}
