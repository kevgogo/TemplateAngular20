// src/app/core/guards/access-control.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import type { User } from '@core/models/user.model';
import { CommonService } from '@core/services/common.service';
import { SettingsService } from '@core/services/settings.service';

export interface GuardData {
  permission?: string; // permiso puntual requerido
  anyPermissions?: string[]; // cumple al menos uno
  allPermissions?: string[]; // cumple todos
  role?: string; // rol puntual requerido
  roles?: string[]; // cumple al menos uno
}

/** Lee un campo string de un objeto desconocido de forma segura */
function readStringField(obj: unknown, key: string): string | null {
  if (obj && typeof obj === 'object') {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === 'string' ? v : null;
  }
  return null;
}

/** Normaliza lista de permisos a Set<string> en minúsculas (seguro) */
function normalizePermissions(raw: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(raw)) return out;

  for (const it of raw as unknown[]) {
    if (typeof it === 'string') {
      out.add(it.trim().toLowerCase());
    } else if (it && typeof it === 'object') {
      const obj = it as Record<string, unknown>;
      // intentamos distintos nombres comunes
      const candUnknown =
        obj['name'] ??
        obj['permission'] ??
        obj['code'] ??
        obj['permission_name'] ??
        obj['Permission'] ??
        obj['Name'];

      if (typeof candUnknown === 'string') {
        out.add(candUnknown.trim().toLowerCase());
      }
    }
  }
  return out;
}

/** Obtiene roles del usuario como arreglo de string (minúsculas, seguro) */
function normalizeRoles(user: unknown): string[] {
  const roles: string[] = [];
  if (!user || typeof user !== 'object') return roles;

  const obj = user as Record<string, unknown>;
  const fromArray = obj['roles'];
  if (Array.isArray(fromArray)) {
    for (const r of fromArray) {
      if (typeof r === 'string') roles.push(r.trim().toLowerCase());
    }
  }

  const fromCsv = obj['rol'];
  if (typeof fromCsv === 'string' && fromCsv.length) {
    for (const r of fromCsv.split(',')) {
      const v = r.trim().toLowerCase();
      if (v) roles.push(v);
    }
  }
  return roles;
}

/**
 * Guard de control de acceso:
 * - Requiere token de sesión (401 si falta).
 * - Valida permisos contra `permission_menu` en session.
 * - Valida roles contra `user.roles` o `user.rol` (compat).
 * - Retorna boolean o UrlTree.
 */
export const accessControlGuard: CanActivateFn = (route): boolean | UrlTree => {
  const router = inject(Router);
  const common = inject(CommonService);
  const settings = inject(SettingsService);

  const data = (route.data ?? {}) as GuardData;

  // === 1) Sesión / Token ===
  const user = (settings.getUserSetting() as User | null) ?? null;

  // token puede estar guardado como setting o dentro del user
  const token =
    readStringField(user, 'token') ??
    readStringField(settings.getUserSetting('token'), 'value') ?? // por si guardas {value: '...'}
    ((): string | null => {
      const t = settings.getUserSetting('token');
      return typeof t === 'string' ? t : null;
    })();

  if (!token) {
    common.showNotification(
      'warning',
      'Debes iniciar sesión para acceder.',
      'No autorizado',
    );
    return router.createUrlTree(['/']);
  }

  // === 2) Permisos ===
  const rawPerms = common.obtenerElementoSession('permission_menu');
  const permSet = normalizePermissions(rawPerms);

  const needSingle = data.permission?.trim().toLowerCase() ?? null;
  const needAny = (data.anyPermissions ?? [])
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const needAll = (data.allPermissions ?? [])
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  let allowed = true;
  if (needSingle) allowed &&= permSet.has(needSingle);
  if (needAny.length) allowed &&= needAny.some((p) => permSet.has(p));
  if (needAll.length) allowed &&= needAll.every((p) => permSet.has(p));

  if (!allowed) {
    common.showNotification(
      'warning',
      'No tienes permisos para acceder a esta sección.',
      'Permisos',
    );
    return router.createUrlTree(['/']); // o tu ruta 403
  }

  // === 3) Roles ===
  const roles = normalizeRoles(user);
  const needRole = data.role?.trim().toLowerCase() ?? null;
  const needRoles = (data.roles ?? [])
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);

  if (needRole && !roles.includes(needRole)) {
    common.showNotification(
      'warning',
      'Tu rol no tiene acceso a esta sección.',
      'Roles',
    );
    return router.createUrlTree(['/']);
  }
  if (needRoles.length && !needRoles.some((r) => roles.includes(r))) {
    common.showNotification(
      'warning',
      'Tu rol no tiene acceso a esta sección.',
      'Roles',
    );
    return router.createUrlTree(['/']);
  }

  return true;
};
