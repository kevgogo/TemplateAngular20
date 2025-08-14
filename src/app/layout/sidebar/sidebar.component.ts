import { CommonModule } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input({ required: true }) collapsed = false;

  items = [
    { icon: 'bi-house', label: 'Inicio', link: '/' },
    { icon: 'bi-grid', label: 'Módulos', link: '/modules' },
  ];

  @HostBinding('class.is-collapsed')
  get isCollapsedClass() {
    return this.collapsed;
  }
}
