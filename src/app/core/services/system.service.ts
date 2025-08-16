import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_URLS } from '@core/constants/api-urls';
import { SettingsService } from '@core/services/settings.service';
import { System } from '@core/models/system.models';

@Injectable({
  providedIn: 'root',
})
export class SystemService {
  private _URLS = API_URLS();
  constructor(private client: HttpClient, private setting: SettingsService) {}

  getSystem() {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    return this.client.get(this._URLS.SYSTEM.GET, { headers: headers });
  }

  createSystem(data: System) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    return this.client.post(this._URLS.SYSTEM.SAVE, data, {
      headers: headers,
    });
  }

  updateSystem(data: System) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    return this.client.put(this._URLS.SYSTEM.SAVE, data, { headers: headers });
  }

  cancelSystem(id: number, status: number) {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    return this.client.get(
      this._URLS.SYSTEM.CANCEL + '?id=' + id + '&status=' + status,
      { headers: headers }
    );
  }

  getSystemActive() {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: 'application/json', //siempre que se retorne un string agregar esta linea please
      Authorization: `Bearer ${this.setting.getUserSetting('token')}`,
    });
    return this.client.get(this._URLS.SYSTEM.GET_ACTIVE, { headers: headers });
  }
}
