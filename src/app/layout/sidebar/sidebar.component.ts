import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  Input,
  signal,
  Signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AnyItem, MenuNode, SidebarItem } from '@core/models/menu.types';
import { LayoutService } from '@core/services/layout.service';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import { DEMO_MENU } from '@shared/mock/fake-menu';
import { Subscription } from 'rxjs';

type SearchScope = 'all' | 'root';
interface FlatResult {
  node: MenuNode;
  depth: number;
}

/* ===================== Helpers de tipos ===================== */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}
function getComposedPath(e: Event): EventTarget[] | undefined {
  const anyEv = e as unknown as { composedPath?: () => EventTarget[] };
  return typeof anyEv.composedPath === 'function'
    ? anyEv.composedPath()
    : undefined;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly Math = Math;

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
  @Input() set items(value: AnyItem[] | null | undefined) {
    const coerced = this.coerceToMenuNodes(value);
    this._originalItems = this.normalize(coerced);
    this.resetListPreservingSelection();
  }
  /** Getter para la lista que se pinta en el sidebar (expandidos) */
  get items(): MenuNode[] {
    // Solo filtra en modo expandido y cuando se está buscando
    if (!this.collapsedResolved && this.isSearching()) {
      return this.sidebarFilteredItems();
    }
    return this._originalItems;
  }

  // ====== OPCIONES ======
  @Input() rememberFlypanelScroll = true; // recuerda scroll entre vistas del flypanel
  @Input() scrollToTopOnNewSearch = true; // al cambiar término de búsqueda, sube al top

  /** Máx. resultados a renderizar en el panel de búsqueda (inicial) */
  @Input() panelInitialLimit = 15;
  /** Cuántos sumar cada vez que el usuario pida “Mostrar más” */
  @Input() panelLoadStep = 15;
  @Input() panelIndentInSearch = false; // true = indenta por nivel, false = sin indentado

  // ===== Footer de búsqueda =====
  @Input() showSearchFooter = true; // poder ocultarlo si no lo quieres

  /** Límite actual visible (se resetea al abrir búsqueda o cambiar término) */
  readonly panelLimit = signal(this.panelInitialLimit ?? 15);

  /** Colección “plana” de resultados (respeta searchHideParentsInPanel) */
  readonly panelResultsFlat = computed<FlatResult[]>(() => {
    const out: FlatResult[] = [];
    const walk = (nodes: MenuNode[], depth: number) => {
      for (const n of nodes) {
        const has = this.hasChildren(n);
        if (!(this.searchHideParentsInPanel && has))
          out.push({ node: n, depth });
        if (has) walk(n.children!, depth + 1);
      }
    };
    walk(this.panelFilteredItems(), 0);
    return out;
  });

  /** Resultados visibles según límite actual */
  readonly visiblePanelResults = computed(() =>
    this.panelResultsFlat().slice(0, this.panelLimit()),
  );

  /** Cuántos faltan por mostrar */
  readonly remainingPanelResults = computed(() =>
    Math.max(0, this.panelResultsFlat().length - this.panelLimit()),
  );

  readonly totalPanelResults = computed(() => this.panelResultsFlat().length);

  showMorePanel(): void {
    this.panelLimit.update((v) => v + this.panelLoadStep);
  }
  showAllPanel(): void {
    this.panelLimit.set(this.panelResultsFlat().length);
  }

  // ====== ESTADO DE SCROLL DEL FLYPANEL ======
  private panelScrollPos = new Map<string, number>();
  private flypanelScrollHandler?: (e: Event) => void;

  /** El menú lateral base (no filtrado) */
  private _originalItems: MenuNode[] = this.normalize(
    this.coerceToMenuNodes(DEMO_MENU as unknown),
  );

  private readonly layout = inject(LayoutService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Garantiza tipo `HTMLElement` (evita any en `nativeElement`) */
  private get hostElement(): HTMLElement {
    return this.host.nativeElement as unknown as HTMLElement;
  }

  // ====== Bloqueo/desbloqueo de scroll del body (panel abierto) ======
  private savedScrollY = 0;
  private preventScroll = (e: Event): void => {
    const t = (e.target as HTMLElement) || null;
    const path = getComposedPath(e);

    const insideFlypanel =
      !!this._flypanelEl &&
      (this._flypanelEl === t ||
        (t && this._flypanelEl.contains(t)) ||
        (path?.includes(this._flypanelEl) ?? false));

    if (insideFlypanel) return; // ✅ deja que el panel haga scroll
    e.preventDefault(); // ⛔️ bloquea scroll del body/fondo
  };

  // ====== Hook para cerrar si hay scroll dentro del flypanel ======
  private flypanelScrollSub?: Subscription;

  @ViewChild('flypanelEl')
  set flypanelElSetter(ref: ElementRef<HTMLElement> | undefined) {
    // limpia subs anteriores
    this.flypanelScrollSub?.unsubscribe();
    this.flypanelScrollSub = undefined;

    // quita listener anterior si existe
    if (this.flypanelScrollHandler && this._flypanelEl) {
      this._flypanelEl.removeEventListener(
        'scroll',
        this.flypanelScrollHandler,
      );
    }

    this._flypanelEl = ref?.nativeElement ?? null;

    if (this._flypanelEl) {
      // guarda scroll en cada evento
      this.flypanelScrollHandler = () => this.saveCurrentScroll();
      // passive true (mejor perf.), capture false (por defecto)
      const opts: AddEventListenerOptions = { passive: true };
      this._flypanelEl.addEventListener(
        'scroll',
        this.flypanelScrollHandler,
        opts,
      );

      // restaura si tenemos record
      queueMicrotask(() => this.restoreCurrentScroll());
    }
  }
  private _flypanelEl: HTMLElement | null = null;

  // ====== HELPERS DE SCROLL ======
  private currentScrollKey(): string {
    if (this.searchMode) {
      const root = this.searchRoot?.label ?? '';
      return this.searchScope === 'root' ? `search:root:${root}` : 'search:all';
    }
    const path = this.panelStack.map((n) => n.label || '').join(' > ');
    return `stack:${path || 'root'}`;
  }

  private saveCurrentScroll(): void {
    if (!this.rememberFlypanelScroll || !this._flypanelEl) return;
    this.panelScrollPos.set(
      this.currentScrollKey(),
      this._flypanelEl.scrollTop,
    );
  }

  private restoreCurrentScroll(): void {
    if (!this._flypanelEl) return;
    const y = this.rememberFlypanelScroll
      ? (this.panelScrollPos.get(this.currentScrollKey()) ?? 0)
      : 0;
    this._flypanelEl.scrollTop = y;
  }

  private resetCurrentScroll(): void {
    if (!this._flypanelEl) return;
    this._flypanelEl.scrollTop = 0;
    if (this.rememberFlypanelScroll) {
      this.panelScrollPos.set(this.currentScrollKey(), 0);
    }
  }

  // ====== Refs de input en el panel (para focus) ======
  @ViewChild('searchInputEl') searchInputEl?: ElementRef<HTMLInputElement>;

  // ------------------ BÚSQUEDA EN SIDEBAR EXPANDIDO ------------------
  readonly searchTerm = signal('');
  readonly isSearching: Signal<boolean> = computed(
    () => this.searchTerm().trim().length > 0,
  );

  private readonly sidebarFilteredItems = computed(() => {
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
  readonly panelSearchTerm = signal('');
  readonly panelIsSearching: Signal<boolean> = computed(
    () => this.panelSearchTerm().trim().length > 0,
  );

  private searchScope: SearchScope = 'all';
  private searchRoot: MenuNode | null = null;

  private searchBaseNodes(): MenuNode[] {
    if (this.searchScope === 'root' && this.searchRoot) {
      return this.searchRoot.children ?? [];
    }
    return this._originalItems;
  }

  readonly panelFilteredItems = computed(() => {
    const term = this.panelSearchTerm().toLowerCase().trim();
    if (!term) return this.searchBaseNodes();
    return this.filterMenuItems(this.searchBaseNodes(), term);
  });

  onPanelSearchChange(v: string): void {
    this.panelSearchTerm.set(v);
    this.panelLimit.set(this.panelInitialLimit);
    if (this.scrollToTopOnNewSearch) this.resetCurrentScroll();
  }

  clearPanelSearch(): void {
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

  readonly hasChildren = (n?: MenuNode | null): boolean =>
    !!n && !!n.children?.length;

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
      if (k === prefix || k.startsWith(prefix + '.')) {
        this.openSet.delete(k);
      }
    }

    for (const k of Array.from(this.forcedOpen)) {
      if (k === prefix || k.startsWith(prefix + '.')) {
        this.forcedOpen.delete(k);
      }
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
  // Modifica estos métodos en tu componente:

  onRootClick(ev: MouseEvent, node: MenuNode, rootIndex: number): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      if (this.collapsedResolved) {
        if (this.panelOpenRootIndex === rootIndex) this.closePanel();
        else
          this.openPanelForRoot(
            ev.currentTarget as HTMLElement,
            node,
            rootIndex,
          );
      } else {
        const id = this.nodeId(null, rootIndex);

        // CAMBIO CLAVE: permitir cerrar incluso si está en forcedOpen
        if (this.isOpen(id)) {
          // Cerrar la rama
          this.closeBranch(id);
          // Remover también de forcedOpen si existe
          this.forcedOpen.delete(id);
        } else {
          if (this.accordionPerLevel) {
            this.collapseSiblings(id);
          }
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
        // CAMBIO CLAVE: permitir cerrar incluso si está en forcedOpen
        if (this.isOpen(id)) {
          this.closeBranch(id);
          // Remover también de forcedOpen si existe
          this.forcedOpen.delete(id);
        } else {
          if (this.accordionPerLevel) {
            this.collapseSiblings(id);
          }
          this.openSet.add(id);
        }
      }
    } else {
      if (this.collapsedResolved) this.closePanel();
    }
  }

  // Método adicional para forzar el cierre de un nodo específico
  forceClose(nodeId: string): void {
    this.openSet.delete(nodeId);
    this.forcedOpen.delete(nodeId);
    this.closeBranch(nodeId);
  }

  // Modifica también el método closeBranch para limpiar forcedOpen

  getActiveClass(node: MenuNode, nodeId: string): string | null {
    // Si tiene hijos y está abierto, devolver 'active'
    if (this.hasChildren(node) && this.isOpen(nodeId)) {
      return 'active';
    }

    // Si NO tiene hijos, permitir que routerLinkActive maneje el estado
    if (!this.hasChildren(node)) {
      return 'active';
    }

    // Si tiene hijos pero está cerrado, no aplicar 'active'
    return null;
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
    return current?.children ?? [];
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
    rootIndex: number,
  ): void {
    this.searchMode = false;
    this.searchScope = 'all';
    this.searchRoot = null;

    this.panelOpenRootIndex = rootIndex;
    this.panelStack = [rootNode];
    this.repositionPanel(anchorEl);
    this.lockScroll();
    queueMicrotask(() => this.restoreCurrentScroll());
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
    this.panelLimit.set(this.panelInitialLimit);
    queueMicrotask(() => {
      if (this.scrollToTopOnNewSearch) this.resetCurrentScroll();
      this.searchInputEl?.nativeElement?.focus();
    });
  }

  /** Búsqueda SOLO dentro del root actualmente abierto en el panel */
  openRootSearch(): void {
    const currentRoot = this.panelStack[0] ?? null;
    if (!currentRoot) return;

    this.searchMode = true;
    this.searchScope = 'root';
    this.searchRoot = currentRoot;
    this.panelSearchTerm.set('');
    this.panelLimit.set(this.panelInitialLimit);
    queueMicrotask(() => {
      if (this.scrollToTopOnNewSearch) this.resetCurrentScroll();
      this.searchInputEl?.nativeElement?.focus();
    });
  }

  onPanelItemClick(ev: MouseEvent, node: MenuNode): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      this.saveCurrentScroll();
      this.panelStack.push(node);
    } else {
      this.closePanel();
    }
  }

  onSearchNodeClick(ev: MouseEvent, node: MenuNode): void {
    if (this.hasChildren(node)) {
      ev.preventDefault();
      this.saveCurrentScroll();
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
      this.onSearchNodeClick(ev, node);
    } else {
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
    if (this.panelStack.length > 1) {
      this.saveCurrentScroll();
      this.panelStack.pop();
      queueMicrotask(() => this.restoreCurrentScroll());
    } else this.closePanel();
  }

  closeFlypanel(): void {
    this.closePanel();
  }

  closePanel(): void {
    if (!this.panelOpen && !this.searchMode) return;
    this.saveCurrentScroll();
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
    const li = anchorEl.closest('li.item, button, a') ?? anchorEl;
    const r = li.getBoundingClientRect();

    const hostEl = this.hostElement;
    const aside = hostEl.querySelector('aside.sidebar');
    if (!aside) return;

    const a = aside.getBoundingClientRect();
    const maxTop = Math.max(8, Math.min(r.top, window.innerHeight - 16 - 320));
    this.panelStyle = {
      position: 'fixed',
      top: `${Math.round(maxTop)}px`,
      left: `${Math.round(a.right)}px`,
      minWidth: '260px',
    };
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    if (this.collapsedResolved) this.closePanel();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.collapsedResolved && (this.panelOpen || this.searchMode)) {
      const hostEl = this.hostElement;

      const found = hostEl.querySelector(
        '.collapsed-search .link, li.item > .link',
      );
      const btn: HTMLElement | undefined =
        found instanceof HTMLElement ? found : undefined;

      if (btn) this.repositionPanel(btn);
    }
  }

  // ------------------ Reset + mantener selección ------------------
  private resetListPreservingSelection(): void {
    this.openSet.clear();
    this.forcedOpen.clear();
    const path = this.findActiveIndexPath(this._originalItems);
    if (path) this.openIndexPath(path);
  }

  private openIndexPath(path: number[]): void {
    let pid: string | null = null;
    for (const idx of path.slice(0, -1)) {
      pid = this.nodeId(pid, idx);
      this.forcedOpen.add(pid);
    }
  }

  private findActiveIndexPath(
    nodes: MenuNode[],
    trail: number[] = [],
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
      : typeof n.link === 'string'
        ? n.link
        : '';

    return toUrl !== '' && current === toUrl;
  }

  // ================== Conversión SidebarItem -> MenuNode ==================
  private isSidebarItem(o: unknown): o is SidebarItem {
    return isRecord(o) && 'text' in o;
  }
  private isMenuNode(o: unknown): o is MenuNode {
    return isRecord(o) && 'label' in o;
  }
  private coerceToMenuNodes(items: unknown): MenuNode[] {
    if (!Array.isArray(items)) return [];

    const mapOne = (it: unknown): MenuNode => {
      if (this.isSidebarItem(it)) {
        const kids = Array.isArray(it.submenu) ? it.submenu : undefined;
        return {
          label: it.text ?? '',
          link: it.link ?? undefined,
          icon: it.icon ?? undefined,
          children: kids?.length ? kids.map(mapOne) : undefined,
        };
      }
      if (this.isMenuNode(it)) {
        const kids = Array.isArray(it.children) ? it.children : undefined;
        return {
          label: it.label ?? '',
          link: it.link ?? undefined,
          icon: it.icon ?? undefined,
          children: kids?.length ? kids.map(mapOne) : undefined,
        };
      }
      return { label: '' };
    };

    return items.map(mapOne);
  }

  // ====== Lock/unlock scroll del body ======
  private lockScroll(): void {
    this.savedScrollY =
      window.scrollY ?? document.documentElement.scrollTop ?? 0;
    document.documentElement.classList.add('sidebar-flypanel-open');
    document.body.classList.add('sidebar-flypanel-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    const opts: AddEventListenerOptions = { passive: false, capture: true };
    window.addEventListener('wheel', this.preventScroll, opts);
    window.addEventListener('touchmove', this.preventScroll, opts);
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

    // Debe coincidir el flag capture con el registro
    const rmOpts: EventListenerOptions = { capture: true };
    window.removeEventListener('wheel', this.preventScroll, rmOpts);
    window.removeEventListener('touchmove', this.preventScroll, rmOpts);

    if (wasLocked) window.scrollTo(0, this.savedScrollY);
  }

  // Utilidad: resaltar términos
  highlightSearchTerm(text: string, term: string): string {
    const t = term.trim();
    if (!t || t.length < 2) return text;
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
  private addOpenNodesRecursively(
    nodes: MenuNode[],
    parentId: string | null,
  ): void {
    nodes.forEach((node, index) => {
      const id = this.nodeId(parentId, index);
      if (this.hasChildren(node)) {
        this.openSet.add(id);
        this.addOpenNodesRecursively(node.children!, id);
      }
    });
  }
}
