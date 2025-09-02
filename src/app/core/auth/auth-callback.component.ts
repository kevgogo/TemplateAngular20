import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { CommonService } from '@core/services/common.service';
import { MenuService } from '@core/services/menu.service';
import { SettingsService } from '@core/services/settings.service';

import { GraphQLAuthService } from '@core/graphql/graphql-auth.service';
import { GraphQLClientService } from '@core/graphql/graphql-client.service';

import { EMPTY } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import type { ApiArray, ApiObject, TokenPayload } from '@core/models/api.types';
import type { User } from '@core/models/user.model';

type UserRaw = User & Record<string, unknown>;
type UserContextResponse = (ApiObject<UserRaw> | ApiArray<UserRaw>) &
  TokenPayload;
interface UiTheme {
  theme?: string;
  skin?: string;
}

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
    this.applyThemeFromStorage();
    window.addEventListener('storage', this.onStorage);

    const qp = this.route.snapshot.queryParamMap;
    const keyLogin =
      qp.get('KeyLoggin') ??
      qp.get('KeyLogin') ??
      qp.get('keyLogin') ??
      qp.get('key') ??
      qp.get('token') ??
      '';

    if (!keyLogin) {
      void this.common.redirecToUnauthorized({
        code: '401',
        error: 'Token',
        message: 'Token no válido',
      });
      return;
    }

    this.auth.getUserContext(keyLogin).subscribe({
      next: (x) => {
        const RESPONSE = x as UserContextResponse;
        if (RESPONSE.typeResult === 1) {
          const payload = (x as ApiObject<UserRaw> | ApiArray<UserRaw>)
            .objectResult;
          const user: UserRaw =
            (Array.isArray(payload) ? payload?.[0] : payload) ??
            ({} as UserRaw);

          for (const [k, v] of Object.entries(user)) {
            this.setting.setUserSetting(k, v);
          }

          const bearer =
            user.token ??
            RESPONSE.messageResult ??
            RESPONSE.token ??
            RESPONSE.Token ??
            null;

          if (!bearer) {
            void this.common.redirecToUnauthorized({
              code: '401',
              error: 'No autorizado',
              message: 'No se obtuvo un token válido del contexto de usuario.',
            });
            return;
          }
          this.setting.setUserSetting('token', bearer);

          this.menu
            .loadAndBuildMenuTree$()
            .pipe(take(1))
            .subscribe({
              next: () => {
                this.prefetchGraphQLToken();
                void this.router.navigate(['']);
              },
              error: () => {
                void this.common.redirecToError({
                  code: '500',
                  error: 'Menú',
                  message: 'No fue posible construir el menú del usuario.',
                });
              },
            });
        } else {
          void this.common.redirecToUnauthorized({
            code: '401',
            error: 'No autorizado',
            message: RESPONSE.messageResult ?? 'No se pudo autenticar.',
          });
        }
      },
      error: () => {
        void this.common.redirecToError({
          code: '500',
          error: 'Autenticación',
          message: 'Error consultando el contexto del usuario.',
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
      const root = this.doc.documentElement;
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
        switchMap((ok) => (ok ? this.gqlAuth.getGraphQLToken() : EMPTY)),
      )
      .subscribe();
  }
}
