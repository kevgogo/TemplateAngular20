import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';
import { MenuService } from '@core/services/menu.service';
import { CommonService } from '@core/services/common.service';

import { GraphQLAuthService } from '@core/graphql/graphql-auth.service';
import { GraphQLClientService } from '@core/graphql/graphql-client.service';

import { switchMap, take } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

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
  private gql = inject(GraphQLClientService);
  private doc = inject(DOCUMENT);

  private onStorage = (e: StorageEvent) => {
    if (e.key === 'ui.theme.v1') this.applyThemeFromStorage();
  };

  constructor() {
    // 1) Aplica el tema ya guardado (ui.theme.v1) ANTES de pintar
    this.applyThemeFromStorage();
    window.addEventListener('storage', this.onStorage);

    // 2) Soporta múltiples nombres de parámetro (según backend/redirección)
    const qp = this.route.snapshot.queryParamMap;
    const keyLogin =
      qp.get('KeyLoggin') ||
      qp.get('KeyLogin') ||
      qp.get('keyLogin') ||
      qp.get('key') ||
      qp.get('token') ||
      '';

    if (!keyLogin) {
      this.common.redirecToUnauthorized({
        code: '401',
        error: 'Token',
        message: 'Token no válido',
      });
      return;
    }

    // 3) Flujo de autenticación
    this.auth.getUserContext(keyLogin).subscribe({
      next: (x: any) => {
        if (x?.typeResult === 1) {
          const user = x.objectResult?.[0] ?? x.objectResult ?? {};
          // Guarda todo el contexto de usuario tal cual venía antes
          Object.keys(user).forEach((k) =>
            this.setting.setUserSetting(k, user[k])
          );

          // Token (acepta varias formas comunes)
          const bearer =
            user?.token ??
            user?.Token ??
            x?.messageResult ??
            x?.token ??
            x?.Token ??
            null;

          if (!bearer) {
            this.common.redirecToUnauthorized({
              code: '401',
              error: 'No autorizado',
              message: 'No se obtuvo un token válido del contexto de usuario.',
            });
            return;
          }
          this.setting.setUserSetting('token', bearer);

          // 4) Construye + persiste + publica el árbol del menú y luego navega
          this.menu
            .loadAndBuildMenuTree$()
            .pipe(take(1))
            .subscribe({
              next: () => {
                // 5) Prefetch del token de GraphQL (no bloquea)
                this.prefetchGraphQLToken();
                // 6) Redirigir al dashboard/shell
                this.router.navigate(['']);
              },
              error: () => {
                this.common.redirecToError({
                  code: '500',
                  error: 'Menú',
                  message: 'No fue posible construir el menú del usuario.',
                });
              },
            });
        } else {
          this.common.redirecToError({
            code: '404',
            error: 'Not found',
            message: 'Usuario no encontrado',
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

    this.gql
      .isAlive(1500)
      .pipe(
        take(1),
        switchMap((ok) => (ok ? this.gqlAuth.getGraphQLToken() : EMPTY))
      )
      .subscribe({ next: () => {}, error: () => {} });
  }
}
