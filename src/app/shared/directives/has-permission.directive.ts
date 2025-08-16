import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  OnInit,
} from '@angular/core';
import { SettingsService } from '@core/services/settings.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {
  private vcr = inject(ViewContainerRef);
  private tpl = inject(TemplateRef<unknown>);
  private settings = inject(SettingsService);

  @Input('appHasPermission') code?: string;

  ngOnInit(): void {
    this.render();
  }

  private render(): void {
    const ok = this.check(this.code);
    this.vcr.clear();
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }

  private check(code?: string): boolean {
    if (!code) return true;

    // Usa tu método si existe
    const svcHas = (this.settings as any).hasPermission?.bind(this.settings);
    if (svcHas) return svcHas(code);

    // Fallback suave por si no lo tienes
    const user: any =
      (this.settings as any).getUser?.() ?? (this.settings as any).user ?? null;
    const perms: string[] =
      user?.permissions ??
      user?.permisos ??
      (this.settings as any).getPermissions?.() ??
      [];
    return Array.isArray(perms) && perms.includes(code);
  }
}
