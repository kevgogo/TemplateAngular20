import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  FaCssParserService,
  FaIconMeta,
  FaVersionKey,
} from './fa-css-parser.service';

type DisplayMode = 'class' | 'snippet';

@Component({
  selector: 'app-fa-icons-explorer',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './fa-icons-explorer.page.html',
  styleUrls: ['./fa-icons-explorer.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaIconsExplorerPage implements OnInit {
  private faSvc = inject(FaCssParserService);

  // Estado UI
  readonly version = signal<FaVersionKey>('v6');
  readonly q = signal<string>('');
  readonly style = signal<'solid' | 'regular' | 'brands'>('solid');
  readonly display = signal<DisplayMode>('class');
  readonly loading = signal<boolean>(false);
  readonly errorMsg = signal<string | null>(null);

  // Selección pineada
  readonly selected = signal<string | null>(null); // guarda el id del icono

  // Cache por versión (metadatos EN/ES cuando hay JSON)
  private metaByVersion = new Map<FaVersionKey, FaIconMeta[]>();

  // Filtro por búsqueda (matchea id, en, es)
  readonly iconsFiltered = computed<FaIconMeta[]>(() => {
    const items = this.metaByVersion.get(this.version()) ?? [];
    const term = this.q().trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (m) =>
        m.id.includes(term) ||
        (m.en?.toLowerCase().includes(term) ?? false) ||
        (m.es?.toLowerCase().includes(term) ?? false)
    );
  });

  // Orden con el pin en la posición 0 (si forma parte del filtro)
  readonly iconsOrdered = computed<FaIconMeta[]>(() => {
    const list = this.iconsFiltered();
    const sel = this.selected();
    if (!sel) return list;
    const idx = list.findIndex((m) => m.id === sel);
    if (idx < 0 || idx === 0) return list;
    return [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)];
  });

  // Helpers
  isSelected = (id: string) => this.selected() === id;

  select(meta: FaIconMeta) {
    this.selected.set(this.selected() === meta.id ? null : meta.id);
  }

  // Clases de previsualización según versión/estilo
  iconClass = (id: string) => {
    const v = this.version();
    const s = this.style();
    switch (v) {
      case 'v4':
        return `fa fa-${id}`;
      case 'v5':
        return `${
          s === 'brands' ? 'fab' : s === 'regular' ? 'far' : 'fas'
        } fa-${id}`;
      case 'v6':
      case 'v7':
      default:
        const styleClass =
          s === 'brands'
            ? 'fa-brands'
            : s === 'regular'
            ? 'fa-regular'
            : 'fa-solid';
        return `${styleClass} fa-${id}`;
    }
  };

  // Qué copiar
  snippetFor = (id: string) => {
    const classes = this.iconClass(id);
    return this.display() === 'class' ? classes : `<i class="${classes}"></i>`;
  };

  // Copiar al portapapeles
  async copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  // Carga de metadatos por versión (prefiere JSON offline; fallback a parseo CSS)
  private async ensureVersionLoaded(v: FaVersionKey) {
    if (this.metaByVersion.has(v)) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      const meta = await this.faSvc.getIconsMeta(v);
      this.metaByVersion.set(v, meta);
    } catch (e: any) {
      this.errorMsg.set(
        e?.message ??
          'No fue posible cargar los íconos para esta versión (JSON o CSS).'
      );
    } finally {
      this.loading.set(false);
    }
  }

  // Efectos: cargar versión y limpiar pin al cambiar contexto
  private _versionEffect = effect(() => {
    const v = this.version();
    this.ensureVersionLoaded(v);
  });

  private _contextEffect = effect(() => {
    this.version();
    this.style();
    this.selected.set(null);
  });

  ngOnInit(): void {
    this.ensureVersionLoaded(this.version());
  }
}
