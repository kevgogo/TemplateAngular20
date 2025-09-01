import { EventEmitter, Injectable, inject } from '@angular/core';
import type { User } from '@core/models/user.model';
import { CommonService } from '@core/services/common.service';

/* ====================== Tipos ====================== */

interface Layout {
  isFixedHeader: boolean;
  isFixedSidebar: boolean;
  isSidebarClosed: boolean;
  isSidebarFixed: boolean;
  isChatOpen: boolean;
  isFixedFooter: boolean;
  theme: string;
  logo: string;
  logoMini: string;
}

type BoolLayoutKeys =
  | 'isFixedHeader'
  | 'isFixedSidebar'
  | 'isSidebarClosed'
  | 'isSidebarFixed'
  | 'isChatOpen'
  | 'isFixedFooter';

/** Usuario persistido: objeto flexible (User parcial + campos extra) */
type StoredUser = Partial<User> & Record<string, unknown>;

/* ====================== Guards utilitarios ====================== */

function isObjectRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

/* ====================== Servicio ====================== */

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private user: StoredUser | null = null;
  private layout: Layout;

  public readonly onUserChange = new EventEmitter<StoredUser | null>();
  private readonly commun = inject(CommonService);

  constructor() {
    // App Settings por defecto
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

  /* ========== Layout ==========% */

  getLayoutSetting<K extends keyof Layout>(name: K): Layout[K] {
    return this.layout[name];
  }

  setLayoutSetting<K extends keyof Layout>(name: K, value: Layout[K]): void {
    this.layout[name] = value;
  }

  /** Alterna solo propiedades booleanas del layout y devuelve el nuevo valor */
  toggleLayoutSetting(name: BoolLayoutKeys): boolean {
    const next = !this.layout[name];
    this.layout[name] = next;
    return next;
  }

  /* ========== Usuario / sesión ==========% */

  /** Carga el usuario desde storage si aún no está en memoria */
  private ensureUserLoaded(): void {
    if (this.user !== null) return;
    const stored = this.commun.obtenerElementoSession<unknown>(
      'colibri_usr',
      null,
    );
    this.user = isObjectRecord(stored) ? (stored as StoredUser) : null;
  }

  /** Devuelve el objeto de usuario completo (o null si no hay sesión) */
  getUserSetting(): StoredUser | null;
  /** Devuelve una propiedad tipada del usuario (o null si no existe) */
  getUserSetting<T = unknown>(name: string): T | null;
  getUserSetting<T = unknown>(name?: string): (StoredUser | null) | T {
    this.ensureUserLoaded();

    if (!name) {
      return this.user;
    }

    const val: unknown = this.user?.[name];
    return val === undefined ? null : (val as T);
  }

  /** Setea una propiedad en el usuario, persiste y emite el cambio */
  setUserSetting<T = unknown>(name: string, value: T): void {
    this.ensureUserLoaded();
    this.user ??= {};
    // Al ser Record<string, unknown> no hace falta any
    (this.user as Record<string, unknown>)[name] = value as unknown;
    this.commun.registrarElementoSession('colibri_usr', this.user);
    this.onUserChange.next(this.user);
  }

  /** Limpia el usuario de memoria y de storage, y notifica */
  cleanUserSetting(): void {
    this.user = null;
    this.commun.borrarElementoSession('colibri_usr');
    this.commun.borrarElementoSession('menu_usr');
    this.commun.borrarElementoSession('permission_menu');
    this.commun.borrarElementoSession('permisos_usr');
    this.onUserChange.next(this.user);
  }
}
