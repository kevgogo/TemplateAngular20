import { Directive, HostBinding, Input, OnChanges } from '@angular/core';

@Directive({
  selector: 'i[bsIcon], span[bsIcon], div[bsIcon]',
  standalone: true,
})
export class BsIconDirective implements OnChanges {
  @Input('bsIcon') name = ''; // p.ej. "gear", "alarm", "bell"
  @Input() spin = false;

  @HostBinding('class') className = 'bi';

  ngOnChanges(): void {
    this.className = `bi bi-${this.name}` + (this.spin ? ' bi-spin' : '');
  }
}
