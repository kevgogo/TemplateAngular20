import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { APP_NAME_TOKEN } from '@core/tokens/app-tokens';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-headbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './headbar.component.html',
  styleUrls: ['./headbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  isFullscreen = false;
  hideTitle = false;
  private navSub?: Subscription;

  private onFsChange = () => {
    this.isFullscreen = !!document.fullscreenElement;
    this.cdr.markForCheck();
  };

  ngOnInit(): void {
    document.addEventListener('fullscreenchange', this.onFsChange);
    this.onFsChange();

    // setear según ruta actual y actualizar en cada navegación
    this.updateHideTitle();
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.updateHideTitle();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.onFsChange);
    this.navSub?.unsubscribe();
  }

  private updateHideTitle(): void {
    // bajar al hijo más profundo
    let snap = this.route.snapshot;
    while (snap.firstChild) snap = snap.firstChild;

    const data = snap.data ?? {};
    const path = snap.routeConfig?.path ?? '';

    // Ocultar si la ruta lo pide o si es explícitamente ''/home (fallback)
    this.hideTitle =
      !!data['hideHeadbarTitle'] || path === '' || path === 'home';
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
