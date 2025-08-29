import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Fa4IconsService } from './fa4-icons.service';
import { Fa4Icon } from './fa4-icon.types';

@Component({
  selector: 'app-fa4-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fa4-search.component.html',
  styleUrls: ['./fa4-search.component.scss'],
})
export class Fa4SearchComponent {
  private service = inject(Fa4IconsService);

  // signals
  query = signal<string>('');
  onlyUnique = signal<boolean>(true);
  loaded = signal<boolean>(false);
  icons = signal<Fa4Icon[]>([]);

  // normaliza sin efectos autoreferenciados
  private normalizedQuery = computed(() => this.query().trim().toLowerCase());

  constructor() {
    this.service.load().then((list) => {
      this.icons.set(list);
      this.loaded.set(true);
    });
  }

  filtered = computed(() => {
    const q = this.normalizedQuery();
    const uniq = this.onlyUnique();
    return this.icons().filter((it) => {
      if (!q) return true;
      const nameHit = it.name.toLowerCase().includes(q);
      const aliasHit = it.aliases?.some((a) => a.toLowerCase().includes(q));
      return nameHit || aliasHit;
    });
  });

  copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  classFor(icon: Fa4Icon) {
    return icon.class; // 'fa fa-<name>'
  }

  trackByName(_: number, it: Fa4Icon) {
    return it.name;
  }
}
