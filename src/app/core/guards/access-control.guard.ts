import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { SettingsService } from '@core/services/settings.service';
import { CommonService } from '@core/services/common.service';

type GuardData = {
  /** Un permiso único requerido */
  permission?: string;
  /** Debe cumplir al menos uno */
  anyPermissions?: string[];
  /** Debe cumplir todos */
  allPermissions?: string[];
  /** Soporte opcional por roles si los usas */
  role?: string;
  roles?: string[];
};

function hasPermission(settings: SettingsService, code?: string): boolean {
  if (!code) return true;

  // Usa tu método si existe
  const svcHas = (settings as any).hasPermission?.bind(settings);
  if (svcHas) return svcHas(code);

  // Fallback no intrusivo
  const user: any =
    (settings as any).getUser?.() ?? (settings as any).user ?? null;
  const perms: string[] =
    user?.permissions ??
    user?.permisos ??
    (settings as any).getPermissions?.() ??
    [];
  return Array.isArray(perms) && perms.includes(code);
}

function hasAny(settings: SettingsService, list?: string[]): boolean {
  if (!list?.length) return true;
  return list.some((p) => hasPermission(settings, p));
}

function hasAll(settings: SettingsService, list?: string[]): boolean {
  if (!list?.length) return true;
  return list.every((p) => hasPermission(settings, p));
}

export const accessControlGuard: CanActivateFn = (
  route,
  state
): boolean | UrlTree => {
  const router = inject(Router);
  const settings = inject(SettingsService);
  const common = inject(CommonService);

  // 1) ¿Hay sesión?
  const user = (settings as any).getUser?.() ?? (settings as any).user ?? null;
  const isAuth =
    (settings as any).isAuthenticated?.() ??
    (user !== null && user !== undefined);

  if (!isAuth) {
    // Conserva returnUrl para redirigir post-login
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // 2) ¿Cumple permisos declarados en la ruta?
  const data = (route.data ?? {}) as GuardData;

  const okPerms =
    hasPermission(settings, data.permission) &&
    hasAny(settings, data.anyPermissions) &&
    hasAll(settings, data.allPermissions);

  if (!okPerms) {
    (common as any)?.warn?.('No tienes permisos para acceder a esta sección');
    return router.createUrlTree(['/error/403']);
  }

  // 3) (Opcional) ¿Cumple roles?
  if (data.role || data.roles?.length) {
    const roles: string[] = user?.roles ?? user?.rol?.split?.(',') ?? [];
    const okRoles =
      (data.role ? roles.includes(data.role) : true) &&
      (data.roles?.length ? data.roles.some((r) => roles.includes(r)) : true);

    if (!okRoles) {
      (common as any)?.warn?.('Tu rol no permite acceder a esta sección');
      return router.createUrlTree(['/']);
    }
  }

  return true;
};
