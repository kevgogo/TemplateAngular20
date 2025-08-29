import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-adder',
  imports: [CommonModule],
  templateUrl: './adder.component.html',
})
export class AdderComponent {
  a = signal(0);
  b = signal(0);
  sum = computed(() => this.a() + this.b());

  onA(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    this.a.set(Number.isFinite(v) ? v : 0);
  }
  onB(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    this.b.set(Number.isFinite(v) ? v : 0);
  }
}
