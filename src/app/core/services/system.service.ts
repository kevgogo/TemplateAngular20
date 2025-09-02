import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import type { System } from '@core/models/system.models';
import { SettingsService } from '@core/services/settings.service';
import type { Observable } from 'rxjs';

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function readStringProp(obj: unknown, key: string): string | undefined {
  if (!isObject(obj)) return undefined;
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function getBearerToken(setting: SettingsService): string | undefined {
  // 1) token directo
  const tk = setting.getUserSetting('token');
  if (typeof tk === 'string') return tk;
  if (isObject(tk)) {
    const v = readStringProp(tk, 'value');
    if (v) return v;
  }
  // 2) dentro del usuario persistido
  const usr = setting.getUserSetting();
  if (isObject(usr)) {
    const t1 = readStringProp(usr, 'token');
    if (t1) return t1;
    const t2 = readStringProp(usr, 'Token');
    if (t2) return t2;
  }
  return undefined;
}

@Injectable({ providedIn: 'root' })
export class SystemService {
  private readonly _URLS = API_URLS();
  private readonly client = inject(HttpClient);
  private readonly setting = inject(SettingsService);

  private buildHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    const token = getBearerToken(this.setting);
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  getSystem(): Observable<unknown> {
    return this.client.get(this._URLS.SYSTEM.GET, {
      headers: this.buildHeaders(),
    });
  }

  createSystem(data: System): Observable<unknown> {
    return this.client.post(this._URLS.SYSTEM.SAVE, data, {
      headers: this.buildHeaders(),
    });
  }

  updateSystem(data: System): Observable<unknown> {
    return this.client.put(this._URLS.SYSTEM.SAVE, data, {
      headers: this.buildHeaders(),
    });
  }

  cancelSystem(id: number, status: number): Observable<unknown> {
    const params = new HttpParams()
      .set('id', String(id))
      .set('status', String(status));

    return this.client.get(this._URLS.SYSTEM.CANCEL, {
      headers: this.buildHeaders(),
      params,
    });
  }

  getSystemActive(): Observable<unknown> {
    return this.client.get(this._URLS.SYSTEM.GET_ACTIVE, {
      headers: this.buildHeaders(),
    });
  }
}
