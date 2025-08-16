import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_URLS } from '@core/constants/api-urls';
import { environment } from '@environments/environment';
import { SettingsService } from '@core/services/settings.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _URLS = API_URLS();

  constructor(public client: HttpClient, public setting: SettingsService) {}
  getUserContext(keyLogin: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
    });
    let params = new HttpParams();
    params = params.append('KeyLoggin', keyLogin);
    return this.client.get(this._URLS.SECURITY.LOGIN, {
      headers: headers,
      params: params,
    });
  }

  getMenu() {
    const lang_id: string = environment.land_id;
    const module_id: string = environment.module_id;
    const user_audit: string = this.setting.getUserSetting('userId');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    let params = new HttpParams();
    params = params.append('lang_id', lang_id);
    params = params.append('module_id', module_id);
    params = params.append('user_audit', user_audit);
    return this.client.get(this._URLS.SECURITY.MENU, {
      headers: headers,
      params: params,
    });
  }

  getPermission() {
    const lang_id: string = environment.land_id;
    const module_id: string = environment.module_id;
    const user_audit: string = this.setting.getUserSetting('userId');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    let params = new HttpParams();
    params = params.append('lang_id', lang_id);
    params = params.append('module_id', module_id);
    params = params.append('user_audit', user_audit);
    return this.client.get(this._URLS.SECURITY.PERMISSION, {
      headers: headers,
      params: params,
    });
  }
}
