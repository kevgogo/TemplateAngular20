import { Injectable, EventEmitter } from '@angular/core';
import { User } from '@core/models/user.model';
import { CommonService } from '@core/services/common.service';
import { AuthService } from '@core/services/auth.service';
import { SettingsService } from '@core/services/settings.service';

@Injectable({ providedIn: 'root' })
export class MenuService {
  menuItems: Array<any>;
  onChange = new EventEmitter();
  constructor(
    private _common: CommonService,
    private auth: AuthService,
    private settingServ: SettingsService
  ) {
    this.menuItems = [];
  }

  addMenu(
    items: Array<{
      text: string;
      link?: string;
      el?: any;
      target?: string;
      icon?: string;
      alert?: string;
      submenu?: any;
    }> = []
  ) {
    items.forEach((item) => {
      this.menuItems.push(item);
    });
    this.onChange.emit(this.menuItems);
  }

  getMenu(): Array<{
    text: string;
    link?: string;
    el?: any;
    target?: string;
    icon?: string;
    alert?: string;
    submenu?: any;
  }> {
    const usr: User = this.settingServ.getUserSetting('');
    if (usr != null)
      this.auth.getMenu().subscribe((result: any) => {
        if (result.typeResult == 1) {
          const menuInfoS = result.objectResult; //JSON.parse(result.objectResult);
          if (menuInfoS != null) {
            const menuInfo = menuInfoS.filter(
              (x: any) => x.codeMenu == '0000'
            )[0]; //padre
            let menuInners = menuInfoS.filter(
              (x: any) => x.fatherId == menuInfo.id
            ); //hijos
            menuInners = menuInners.filter((x: any) => x.codeMenu != '0000'); //El padre no puede estar en el listado
            const menuChildrens = menuInfoS.filter(
              (x: any) => x.fatherId != null
            ); //nietos mal llamados

            const menuFormat = menuInners.map((x: any) => {
              const item = {
                text: x.description,
                link: x.url || '',
                icon: x.icon,
                alert: '',
                submenu: [] as any[],
              };
              const menuX = menuChildrens.filter(
                (y: any) => y.fatherId == x.id
              ); //trae todos los hijos del menu
              for (const m of menuX) {
                item.submenu.push({ text: m.description, link: m.url || '' });
              }
              return item;
            });
            this.addMenu(menuFormat);
            this._common.registrarElementoSession('menu_usr', menuFormat);
          }
        }
      });
    return this.menuItems;
  }
  getPermission() {
    const usr: User = this.settingServ.getUserSetting('');
    if (usr != null)
      this.auth.getPermission().subscribe((result: any) => {
        if (result.typeResult == 1) {
          const permissionMenu = result.objectResult.filter(
            (menuInfo: any) => menuInfo.url != null && menuInfo.fatherId != null
          ); //menuInfo.description != "MENU" &&
          this._common.registrarElementoSession(
            'permission_menu',
            permissionMenu
          );
        }
      });
    return this.menuItems;
  }
}
