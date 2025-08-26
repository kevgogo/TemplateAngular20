import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';
import { MenuService } from '@core/services/menu.service';
import { CommonService } from '@core/services/common.service';

import { GraphQLAuthService } from '@core/graphql/graphql-auth.service';
import { GraphQLClientService } from '@core/graphql/graphql-client.service';

import { switchMap, take, catchError } from 'rxjs/operators';
import { EMPTY, forkJoin, of } from 'rxjs';

// 👇 Tipos y utilidades para armar y persistir menús
import { ApiMenuResponse, RawMenuItem } from '@core/models/menu.types';
import { buildAndPersistMenus } from '@core/utils/menu-adapters.util';

type UiTheme = { theme?: string; skin?: string };

function getObjResult<T>(resp: any, fallback: T[] = []): T[] {
  return resp?.typeResult === 1 && Array.isArray(resp.objectResult)
    ? (resp.objectResult as T[])
    : fallback;
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
    // 1) Tema antes de pintar
    this.applyThemeFromStorage();
    window.addEventListener('storage', this.onStorage);

    // 2) Flujo de login
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
        if (x?.typeResult !== 1) {
          this.common.redirecToError({
            code: '404',
            error: 'Not found',
            message: 'usuario no encontrado',
          });
          return;
        }

        // 2.1) Guardar usuario + token
        const user = x.objectResult?.[0] ?? {};
        Object.keys(user).forEach((k) =>
          this.setting.setUserSetting(k, user[k])
        );
        this.setting.setUserSetting('token', x.messageResult);

        // 2.2) Cargar menú + permisos, construir árbol y persistir "menu_nodes" / "menu_usr"
        forkJoin({
          menu: this.menu.getMenu(),
          perms: this.menu.getPermission(),
        })
          .pipe(
            take(1),
            catchError(() => of({ menu: null, perms: null } as any))
          )
          .subscribe({
            next: ({ menu, perms }) => {
              try {
                const permissionMenu = getObjResult<any>(perms);
                sessionStorage.setItem(
                  'permission_menu',
                  JSON.stringify(permissionMenu)
                );
              } catch {
                /* no-op */
              }

              // Tipamos aquí el array final
              const raw = getObjResult<RawMenuItem>(menu);
              buildAndPersistMenus(raw, {
                // baseHref: '/plantilla-colibri-app-20',
                filterStatus: 1,
              });

              this.prefetchGraphQLToken();
              this.router.navigate(['']);
            },
            error: () => {
              this.common.redirecToError({
                code: '500',
                error: 'Server Error',
                message: 'No fue posible cargar el menú',
              });
            },
          });
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
