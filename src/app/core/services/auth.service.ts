// src/app/core/services/auth.service.ts
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import type { ApiArray, ApiObject, TokenPayload } from '@core/models/api.types';
import type { User } from '@core/models/user.model';
import { SettingsService } from '@core/services/settings.service';
import { environment } from '@environments/environment';
import type { Observable } from 'rxjs';

/* ===================== Tipos ===================== */

type UserRaw = User & Record<string, unknown>;
export type UserContextResponse = (ApiObject<UserRaw> | ApiArray<UserRaw>) &
  TokenPayload;

/* ===================== Helpers seguros ===================== */

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/** Lee una propiedad string de un objeto desconocido de forma segura */
function readStringProp(obj: unknown, key: string): string | undefined {
  if (!isObject(obj)) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

/** Obtiene un token (Bearer) desde SettingsService normalizado a string|undefined */
function getBearerToken(setting: SettingsService): string | undefined {
  // 1) token guardado explícito
  const tk = setting.getUserSetting('token');
  if (typeof tk === 'string') return tk;
  if (isObject(tk)) {
    const v = readStringProp(tk, 'value');
    if (v) return v;
  }

  // 2) dentro del usuario persistido (compat)
  const usr = setting.getUserSetting();
  if (isObject(usr)) {
    const t1 = readStringProp(usr, 'token');
    if (t1) return t1;
    const t2 = readStringProp(usr, 'Token');
    if (t2) return t2;
  }
  return undefined;
}

/** Lee un setting (p. ej. userId) y lo convierte a string cuando es string|number */
function getStringSetting(
  setting: SettingsService,
  key: string,
): string | undefined {
  const val = setting.getUserSetting(key);
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (isObject(val)) {
    const v = readStringProp(val, 'value');
    if (v) return v;
  }
  return undefined;
}

/* ===================== Servicio ===================== */

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _URLS = API_URLS();
  private readonly client = inject(HttpClient);
  private readonly setting = inject(SettingsService);

  /** Obtiene el contexto de usuario por KeyLoggin (respuesta tipada) */
  getUserContext(keyLogin: string): Observable<UserContextResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json', // cuando backend devuelve string/JSON
    });

    const params = new HttpParams().set('KeyLoggin', keyLogin);

    const url = this._URLS.SECURITY.LOGIN;
    return this.client.get<UserContextResponse>(url, { headers, params });
  }

  /** Carga menú del usuario (usa token Bearer si existe) */
  getMenu(): Observable<unknown> {
    const lang_id: string = environment.land_id; // según tu env
    const module_id: string = environment.module_id;

    const user_audit = getStringSetting(this.setting, 'userId') ?? ''; // evita undefined en params

    // Headers (Authorization solo si existe token)
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    const token = getBearerToken(this.setting);
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    const params = new HttpParams()
      .set('lang_id', lang_id)
      .set('module_id', module_id)
      .set('user_audit', user_audit);

    return this.client.get<unknown>(this._URLS.SECURITY.MENU, {
      headers,
      params,
    });
  }

  /** Carga permisos del usuario (usa token Bearer si existe) */
  getPermission(): Observable<unknown> {
    const lang_id: string = environment.land_id;
    const module_id: string = environment.module_id;

    const user_audit = getStringSetting(this.setting, 'userId') ?? '';

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    const token = getBearerToken(this.setting);
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);

    const params = new HttpParams()
      .set('lang_id', lang_id)
      .set('module_id', module_id)
      .set('user_audit', user_audit);

    return this.client.get<unknown>(this._URLS.SECURITY.PERMISSION, {
      headers,
      params,
    });
  }
}
