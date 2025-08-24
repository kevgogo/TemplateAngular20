import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';
import { MenuService } from '@core/services/menu.service';
import { CommonService } from '@core/services/common.service';
import { GraphQLAuthService } from '@core/graphql/graphql-auth.service';

type UiTheme = { theme?: string; skin?: string };

@Component({
  standalone: true,
  selector: 'app-auth-callback',
  imports: [CommonModule, RouterModule],
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss'],
})
export default class AuthCallbackComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private setting = inject(SettingsService);
  private menu = inject(MenuService);
  private common = inject(CommonService);
  private router = inject(Router);
  private gqlAuth = inject(GraphQLAuthService);
  private doc = inject(DOCUMENT);

  private onStorage = (e: StorageEvent) => {
    if (e.key === 'ui.theme.v1') this.applyThemeFromStorage();
  };

  constructor() {
    // 1) Aplica el tema ya guardado (ui.theme.v1) ANTES de pintar
    this.applyThemeFromStorage();
    window.addEventListener('storage', this.onStorage);

    // 2) Tu flujo de login con keyLogin
    const keyLogin = this.route.snapshot.queryParamMap.get('keyLogin') ?? '';
    if (!keyLogin) {
      this.common.redirecToUnauthorized({
        code: '401',
        error: 'Token',
        message: 'Token no valido',
      });
      return;
    }
    this.auth.getUserContext(keyLogin).subscribe({
      next: (x: any) => {
        if (x?.typeResult === 1) {
          const user = x.objectResult?.[0] ?? {};
          Object.keys(user).forEach((k) =>
            this.setting.setUserSetting(k, user[k])
          );
          this.setting.setUserSetting('token', x.messageResult);
          this.menu.getMenu();
          this.menu.getPermission();

          // Cargamos el Token de GraphQL
          this.prefetchGraphQLToken();
          this.router.navigate(['']); // dashboard
        } else {
          this.common.redirecToError({
            code: '404',
            error: 'Not found',
            message: 'usuario no encontrado',
          });
        }
      },
      error: () => {
        this.common.redirecToError({
          code: '500',
          error: 'Server Error',
          message: 'No fue posible validar el usuario',
        });
      },
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.onStorage);
  }

  private applyThemeFromStorage() {
    const raw = localStorage.getItem('ui.theme.v1');
    if (!raw) return;
    try {
      const { theme = 'light', skin = 'green' } = JSON.parse(raw) as UiTheme;
      const root = this.doc.documentElement as HTMLElement;
      root.setAttribute('data-bs-theme', theme);
      root.setAttribute('data-skin', skin);
    } catch {
      /* no-op */
    }
  }

  // helper:
  private prefetchGraphQLToken(): void {
    if (this.setting.getUserSetting('tokenGraphQL')) return;
    this.gqlAuth
      .getGraphQLToken()
      .subscribe({ next: () => {}, error: () => {} });
  }
}
