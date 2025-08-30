import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  HostListener,
  ElementRef,
  signal,
  computed,
  DestroyRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '@core/services/layout.service';
import { DEMO_MENU } from '@shared/mock/fake-menu';
import {
  AnyItem,
  MenuNode,
  SidebarItem,
  RouteLink,
} from '@core/models/menu.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

type SearchScope = 'all' | 'root';

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

  /** Acordeón por nivel en árbol expandido */
  @Input() accordionPerLevel = true;

  /** Flypanel: ocultar filas de padres que tienen hijos en resultados */
  @Input() searchHideParentsInPanel = true;

  /** Flypanel de búsqueda: usa espaciado/fuentes más pequeños */
  @Input() compactSearchInPanel = true;
  /** (Opcional) Ocultar iconos en los resultados del flypanel */
  @Input() compactHideIconsInPanel = false;

  /** Entrada de datos (acepta SidebarItem[] o MenuNode[]) */
  @Input() set items(value: AnyItem[]) {
    const coerced = this.coerceToMenuNodes(value ?? []);
    this._originalItems = this.normalize(coerced);
    this.resetListPreservingSelection();
  }

  /** El menú lateral base (no filtrado) */
  private _originalItems: MenuNode[] = this.normalize(
    this.coerceToMenuNodes(DEMO_MENU as any)
  );

  /** Getter para la lista que se pinta en el sidebar (expandidos) */
  get items(): MenuNode[] {
    // Solo filtra en modo expandido y cuando se está buscando
    if (!this.collapsedResolved && this.isSearching()) {
      return this.sidebarFilteredItems();
    }
    return this._originalItems;
  }

  private layout = inject(LayoutService);
  private host = inject(ElementRef<HTMLElement>);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // ====== Bloqueo/desbloqueo de scroll del body (panel abierto) ======
  private savedScrollY = 0;
  private preventScroll = (e: Event) => e.preventDefault();

  // ====== Hook para cerrar si hay scroll dentro del flypanel ======
  private flypanelScrollSub?: Subscription;
  @ViewChild('flypanelEl')
  set flypanelElSetter(ref: ElementRef<HTMLElement> | undefined) {
    this.flypanelScrollSub?.unsubscribe();
    this.flypanelScrollSub = undefined;
    if (ref?.nativeElement) {
      this.flypanelScrollSub = this.layout.enableAutoCloseOnElement(
        ref.nativeElement,
        { direction: 'any' }
      );
    }
  }

  // ====== Refs de input en el panel (para focus) ======
  @ViewChild('searchInputEl') searchInputEl?: ElementRef<HTMLInputElement>;

  // ------------------ BÚSQUEDA EN SIDEBAR EXPANDIDO ------------------
  searchTerm = signal('');
  isSearching = computed(() => this.searchTerm().trim().length > 0);

  private sidebarFilteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this._originalItems;
    return this.filterMenuItems(this._originalItems, term);
  });

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    if (!this.collapsedResolved) {
      if (!this.isSearching()) {
        this.resetListPreservingSelection();
      } else {
        this.expandAllForSearch();
      }
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.resetListPreservingSelection();
  }

  // ------------------ BÚSQUEDA EN FLYPANEL (COLAPSADO) ------------------
  panelSearchTerm = signal('');
  panelIsSearching = computed(() => this.panelSearchTerm().trim().length > 0);

  private searchScope: SearchScope = 'all';
  private searchRoot: MenuNode | null = null;

  private searchBaseNodes(): MenuNode[] {
    if (this.searchScope === 'root' && this.searchRoot) {
      return this.searchRoot.children ?? [];
    }
    return this._originalItems;
  }

  panelFilteredItems = computed(() => {
    const term = this.panelSearchTerm().toLowerCase().trim();
    if (!term) return this.searchBaseNodes();
    return this.filterMenuItems(this.searchBaseNodes(), term);
  });

  onPanelSearchChange(v: string) {
    this.panelSearchTerm.set(v);
  }
  clearPanelSearch() {
    this.panelSearchTerm.set('');
  }

  /** Filtro recursivo (reutilizado por ambos modos) */
  private filterMenuItems(items: MenuNode[], searchTerm: string): MenuNode[] {
    const filtered: MenuNode[] = [];
    for (const item of items) {
      const matchesItem = (item.label || '').toLowerCase().includes(searchTerm);
      let children: MenuNode[] | undefined;
      if (item.children?.length) {
        children = this.filterMenuItems(item.children, searchTerm);
      }
      if (matchesItem || (children && children.length > 0)) {
        filtered.push({
          ...item,
          children: children?.length ? children : undefined,
        });
      }
    }
    return filtered;
  }

  constructor() {
    this.layout.closeSidebarPanel$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.panelOpen || this.searchMode) this.closePanel();
      });
  }

  // ------------------ Normalización + helpers ------------------
  private normalize(nodes: MenuNode[]): MenuNode[] {
    return (nodes ?? []).map((n) => {
      const kids = Array.isArray(n.children) ? n.children.filter(Boolean) : [];
      return { ...n, children: kids.length ? this.normalize(kids) : undefined };
    });
  }

  hasChildren = (n?: MenuNode | null): boolean => !!n && !!n.children?.length;

  get collapsedResolved(): boolean {
    return this.collapsed ?? this.layout.isSidebarCollapsed();
  }

  // ------------------ Expandido (inline) ------------------
  private openSet = new Set<string>();
  private forcedOpen = new Set<string>();

  nodeId(parentId: string | null, index: number): string {
    return parentId ? `${parentId}.${index}` : String(index);
  }
  isOpen(id: string): boolean {
    return this.openSet.has(id) || this.forcedOpen.has(id);
  }

  toggle(id: string): void {
    if (this.openSet.has(id)) this.openSet.delete(id);
    else this.openSet.add(id);
  }

  private closeBranch(prefix: string): void {
    for (const k of Array.from(this.openSet)) {
      if (k === prefix || k.startsWith(prefix + '.')) this.openSet.delete(k);
    }
  }

  private collapseSiblings(id: string): void {
    if (!this.accordionPerLevel) return;
    const lastDot = id.lastIndexOf('.');
    const parentPrefix = lastDot === -1 ? '' : id.slice(0, lastDot);
    const depth = id.split('.').length;
    for (const k of Array.from(this.openSet)) {
      if (k === id) continue;
      const kDepth = k.split('.').length;
      if (kDepth !== depth) continue;
      const pos = k.lastIndexOf('.');
      const kParentPrefix = pos === -1 ? '' : k.slice(0, pos);
      if (kParentPrefix === parentPrefix) this.closeBranch(k);
    }
  }

  // ------------------ Handlers (expandido / colapsado) ------------------
  onRootClick(ev: MouseEvent, node: MenuNode, rootIndex: number): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (this.collapsedResolved) {
        if (this.panelOpenRootIndex === rootIndex) this.closePanel();
        else
          this.openPanelForRoot(
            ev.currentTarget as HTMLElement,
            node,
            rootIndex
          );
      } else {
        const id = this.nodeId(null, rootIndex);
        if (!this.accordionPerLevel) {
          this.toggle(id);
          return;
        }
        if (this.isOpen(id)) this.closeBranch(id);
        else {
          this.collapseSiblings(id);
          this.openSet.add(id);
        }
      }
      return;
    }
    if (this.collapsedResolved) this.closePanel();
  }

  onItemClick(ev: MouseEvent, node: MenuNode, id: string): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (!this.collapsedResolved) {
        if (!this.accordionPerLevel) {
          this.toggle(id);
          return;
        }
        if (this.isOpen(id)) this.closeBranch(id);
        else {
          this.collapseSiblings(id);
          this.openSet.add(id);
        }
      }
    } else {
      if (this.collapsedResolved) this.closePanel();
    }
  }

  // ------------------ Panel (colapsado) ------------------
  panelOpenRootIndex: number | null = null;
  panelStack: MenuNode[] = [];
  panelStyle: Record<string, string> = {};
  searchMode = false;

  get panelOpen(): boolean {
    return this.panelOpenRootIndex !== null;
  }
  get panelNodes(): MenuNode[] {
    const current = this.panelStack[this.panelStack.length - 1];
    return (current?.children ?? []) as MenuNode[];
  }
  get canGoBack(): boolean {
    return this.panelStack.length > 1;
  }

  get panelTitle(): string {
    if (this.searchMode) {
      return this.searchScope === 'root' && this.searchRoot
        ? `Buscar en ${this.searchRoot.label}`
        : 'Buscar en el menú.';
    }
    return this.panelStack[this.panelStack.length - 1]?.label ?? '';
  }

  openPanelForRoot(
    anchorEl: HTMLElement,
    rootNode: MenuNode,
    rootIndex: number
  ): void {
    this.searchMode = false;
    this.searchScope = 'all';
    this.searchRoot = null;

    this.panelOpenRootIndex = rootIndex;
    this.panelStack = [rootNode];
    this.repositionPanel(anchorEl);
    this.lockScroll();
  }

  /** Búsqueda GLOBAL (desde la lupa del sidebar colapsado) */
  openSearchPanel(anchorEl: HTMLElement): void {
    this.searchMode = true;
    this.searchScope = 'all';
    this.searchRoot = null;
    this.panelSearchTerm.set('');

    this.panelOpenRootIndex = null;
    this.panelStack = [];
    this.repositionPanel(anchorEl);
    this.lockScroll();
    queueMicrotask(() => this.searchInputEl?.nativeElement?.focus());
  }

  /** Búsqueda SOLO dentro del root actualmente abierto en el panel */
  openRootSearch(): void {
    const currentRoot = this.panelStack[0] ?? null;
    if (!currentRoot) return;

    this.searchMode = true;
    this.searchScope = 'root';
    this.searchRoot = currentRoot;
    this.panelSearchTerm.set('');
    queueMicrotask(() => this.searchInputEl?.nativeElement?.focus());
  }

  onPanelItemClick(ev: MouseEvent, node: MenuNode): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      this.panelStack.push(node);
    } else {
      this.closePanel();
    }
  }

  onSearchNodeClick(ev: MouseEvent, node: MenuNode): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      this.searchMode = false;
      this.searchScope = 'all';
      this.searchRoot = null;
      this.panelOpenRootIndex = -1;
      this.panelStack = [node];
    } else {
      this.onPanelItemClick(ev, node);
    }
  }

  onPanelSearchResultClick(ev: MouseEvent, node: MenuNode): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      // En resultados: si es padre, entra al panel normal con ese nodo
      this.onSearchNodeClick(ev, node);
    } else {
      // Hoja: navega y cierra el panel
      this.onPanelItemClick(ev, node);
    }
  }

  panelBack(): void {
    if (this.searchMode) {
      this.searchMode = false;
      this.searchScope = 'all';
      this.searchRoot = null;
      this.panelSearchTerm.set('');
      return;
    }
    if (this.panelStack.length > 1) this.panelStack.pop();
    else this.closePanel();
  }

  closeFlypanel() {
    this.closePanel();
  }

  closePanel(): void {
    if (!this.panelOpen && !this.searchMode) return;
    this.panelOpenRootIndex = null;
    this.panelStack = [];
    this.panelStyle = {};
    this.searchMode = false;
    this.searchScope = 'all';
    this.searchRoot = null;
    this.panelSearchTerm.set('');
    this.unlockScroll();
  }

  /** Posiciona el panel al lado del sidebar, alineado al item clickeado */
  private repositionPanel(anchorEl: HTMLElement): void {
    const li =
      (anchorEl.closest('li.item, button, a') as HTMLElement) ?? anchorEl;
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

  @HostListener('window:keydown.escape')
  onEsc() {
    if (this.collapsedResolved) this.closePanel();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.collapsedResolved && (this.panelOpen || this.searchMode)) {
      const btn =
        this.host.nativeElement.querySelector(
          '.collapsed-search .link, li.item > .link'
        ) || undefined;
      if (btn) this.repositionPanel(btn as HTMLElement);
    }
  }

  // ------------------ Reset + mantener selección ------------------
  private resetListPreservingSelection() {
    this.openSet.clear();
    this.forcedOpen.clear();
    const path = this.findActiveIndexPath(this._originalItems);
    if (path) this.openIndexPath(path);
  }

  private openIndexPath(path: number[]) {
    let pid: string | null = null;
    for (const idx of path.slice(0, -1)) {
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

  // ================== Conversión SidebarItem -> MenuNode ==================
  private isSidebarItem(o: AnyItem): o is SidebarItem {
    return !!o && (o as any)?.text !== undefined;
  }
  private isMenuNode(o: AnyItem): o is MenuNode {
    return !!o && (o as any)?.label !== undefined;
  }
  private coerceToMenuNodes(items: AnyItem[]): MenuNode[] {
    const mapOne = (it: AnyItem): MenuNode => {
      if (this.isSidebarItem(it)) {
        const kids = (it.submenu ?? undefined) as AnyItem[] | undefined;
        return {
          label: it.text ?? '',
          link: (it.link ?? undefined) as RouteLink | undefined,
          icon: (it.icon ?? undefined) as string | undefined,
          children: kids?.length ? kids.map(mapOne) : undefined,
        };
      }
      if (this.isMenuNode(it)) {
        const kids = (it.children ?? undefined) as AnyItem[] | undefined;
        return {
          label: it.label ?? '',
          link: (it.link ?? undefined) as RouteLink | undefined,
          icon: (it.icon ?? undefined) as string | undefined,
          children: kids?.length ? kids.map(mapOne) : undefined,
        };
      }
      return { label: '' };
    };
    return (items ?? []).map(mapOne);
  }

  // ====== Lock/unlock scroll del body ======
  private lockScroll(): void {
    this.savedScrollY =
      window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add('sidebar-flypanel-open');
    document.body.classList.add('sidebar-flypanel-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    window.addEventListener('wheel', this.preventScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener('touchmove', this.preventScroll, {
      passive: false,
      capture: true,
    });
  }

  private unlockScroll(): void {
    const wasLocked = document.body.classList.contains('sidebar-flypanel-open');
    document.documentElement.classList.remove('sidebar-flypanel-open');
    document.body.classList.remove('sidebar-flypanel-open');
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.removeEventListener('wheel', this.preventScroll, {
      capture: true,
    } as any);
    window.removeEventListener('touchmove', this.preventScroll, {
      capture: true,
    } as any);
    if (wasLocked) window.scrollTo(0, this.savedScrollY);
  }

  // Utilidad: resaltar términos
  highlightSearchTerm(text: string, term: string): string {
    const t = term.trim();
    if (!t) return text;
    const regex = new RegExp(`(${this.escapeRegex(t)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ====== Helpers para expandir todo al buscar (sidebar expandido) ======
  private expandAllForSearch(): void {
    this.openSet.clear();
    this.forcedOpen.clear();
    this.addOpenNodesRecursively(this.sidebarFilteredItems(), null);
  }
  private addOpenNodesRecursively(nodes: MenuNode[], parentId: string | null) {
    nodes.forEach((node, index) => {
      const id = this.nodeId(parentId, index);
      if (this.hasChildren(node)) {
        this.openSet.add(id);
        this.addOpenNodesRecursively(node.children!, id);
      }
    });
  }
}
