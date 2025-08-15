// headbar.component.ts
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { APP_NAME_TOKEN } from '@core/tokens/app-tokens';

@Component({
  selector: 'app-headbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './headbar.component.html',
  styleUrls: ['./headbar.component.scss'],
})
export class HeadbarComponent implements OnInit, OnDestroy {
  // Título por defecto desde token (puedes sobrescribirlo con [title])
  private appName = inject(APP_NAME_TOKEN, { optional: true });
  @Input() title = this.appName ?? 'Plantilla Angular 20';

  // Control del sidebar (lo maneja el Shell)
  @Input() sidebarHidden = false;
  @Output() toggleSidebarHidden = new EventEmitter<void>();

  // Navegación y estado
  private location = inject(Location);
  isFullscreen = false;

  private onFsChange = () => {
    this.isFullscreen = !!document.fullscreenElement;
  };

  ngOnInit(): void {
    document.addEventListener('fullscreenchange', this.onFsChange);
    this.onFsChange();
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFsChange);
  }

  onToggleSidebarHiddenClick() {
    this.toggleSidebarHidden.emit();
  }

  onRefresh() {
    window.location.reload();
  }

  onFullscreenToggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  }
}
