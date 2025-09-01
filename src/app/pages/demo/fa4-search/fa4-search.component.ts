import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Fa4Icon } from './fa4-icon.types';
import { Fa4IconsService } from './fa4-icons.service';

@Component({
  selector: 'app-fa4-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fa4-search.component.html',
  styleUrls: ['./fa4-search.component.scss'],
})
export class Fa4SearchComponent {
  private readonly service = inject(Fa4IconsService);

  // signals
  readonly query = signal<string>('');
  readonly onlyUnique = signal<boolean>(true);
  readonly loaded = signal<boolean>(false);
  readonly icons = signal<Fa4Icon[]>([]);

  // normaliza sin efectos autoreferenciados
  private readonly normalizedQuery = computed(() =>
    this.query().trim().toLowerCase(),
  );

  constructor() {
    // manejar rechazo para evitar no-floating-promises
    this.service
      .load()
      .then((list) => {
        this.icons.set(list);
        this.loaded.set(true);
      })
      .catch((err) => {
        console.error('FA4 load failed:', err);
        this.loaded.set(true);
      });
  }

  readonly filtered = computed<Fa4Icon[]>(() => {
    const q = this.normalizedQuery();
    const base = this.icons().filter((it) => {
      if (!q) return true;
      const nameHit = it.name.toLowerCase().includes(q);
      const aliasHit = !!it.aliases?.some((a) => a.toLowerCase().includes(q));
      return nameHit || aliasHit;
    });

    if (!this.onlyUnique()) return base;

    // Dejar solo un icono por nombre
    const seen = new Set<string>();
    const out: Fa4Icon[] = [];
    for (const it of base) {
      if (seen.has(it.name)) continue;
      seen.add(it.name);
      out.push(it);
    }
    return out;
  });

  copy(text: string): void {
    // Evita promesa flotante en handlers
    void navigator.clipboard?.writeText(text);
  }

  classFor(icon: Fa4Icon): string {
    return icon.class; // 'fa fa-<name>'
  }

  trackByName(_index: number, it: Fa4Icon): string {
    return it.name;
  }
}
