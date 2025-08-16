import { EventEmitter, Injectable } from '@angular/core';
import { User } from '@core/models/user.model';
import { CommonService } from '@core/services/common.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private user: any;
  private app: any;
  private layout: any;
  public onUserChange: EventEmitter<User> = new EventEmitter();

  constructor(private commun: CommonService) {
    // User Settings
    // -----------------------------------

    // App Settings
    // -----------------------------------
    this.layout = {
      isFixedHeader: true,
      isFixedSidebar: false,
      isSidebarClosed: false,
      isSidebarFixed: false,
      isChatOpen: false,
      isFixedFooter: false,
      theme: '',
      logo: 'assets/img/logo_40x40.png',
      logoMini: 'assets/img/logo_40x40.png',
    };
  }

  getAppSetting(name: string) {
    return name ? this.app[name] : this.app;
  }

  setAppSetting(name: string, value: any) {
    if (this.app != null) return (this.app[name] = value);
  }

  getLayoutSetting(name: string) {
    return name ? this.layout[name] : this.layout;
  }

  getUserSetting(name: string): any {
    if (this.user == null)
      this.user = this.commun.obtenerElementoSession('colibri_usr');
    return name ? this.user[name] : this.user;
  }
  setUserSetting(name: string, value: any) {
    if (this.user == null) this.user = {};
    if (this.user != null) {
      this.user[name] = value;
      this.commun.registrarElementoSession('colibri_usr', this.user);
    }
  }
  cleanUserSetting() {
    this.user = null;
    this.commun.borrarElementoSession('colibri_usr');
    this.commun.borrarElementoSession('menu_usr');
    this.commun.borrarElementoSession('permission_menu');
    this.commun.borrarElementoSession('permisos_usr');
    this.onUserChange.next(this.user);
  }
  setLayoutSetting(name: string, value: any) {
    if (this.layout != null) {
      return (this.layout[name] = value);
    }
  }

  toggleLayoutSetting(name: string) {
    return this.setLayoutSetting(name, !this.getLayoutSetting(name));
  }
}
