import { Injectable, computed, effect, signal } from '@angular/core';

/** Temas Bootstrap 5.3+ controlados con data-bs-theme */
export type ThemeName = 'light' | 'dark';
export type SkinName =
  | 'azure'
  | 'black'
  | 'blue'
  | 'colibri'
  | 'darkblue'
  | 'darkred'
  | 'deepblue'
  | 'gray'
  | 'green'
  | 'orange'
  | 'pink'
  | 'purple'
  | 'teal';

export interface SkinOption {
  name: SkinName;
  hex: string; // color de muestra (swatch)
  label: string; // cómo se muestra en UI
}

export interface ThemeState {
  theme: ThemeName;
  skin: SkinName;
}

/** Opciones de skin para tu selector en UI */
export const SKIN_OPTIONS: SkinOption[] = [
  { name: 'colibri', hex: '#03b3b2', label: 'Colibri' }, // colibri.less
  { name: 'darkblue', hex: '#0072c6', label: 'Dark Blue' }, // darkblue.less
  { name: 'darkred', hex: '#ac193d', label: 'Dark Red' }, // darkred.less
  { name: 'deepblue', hex: '#001940', label: 'Deep Blue' }, // deepblue.less
  { name: 'gray', hex: '#585858', label: 'Gray' }, // gray.less
  { name: 'green', hex: '#53a93f', label: 'Green' }, // green.less
  { name: 'orange', hex: '#ff8f32', label: 'Orange' }, // orange.less
  { name: 'pink', hex: '#cc324b', label: 'Pink' }, // pink.less
  { name: 'purple', hex: '#8c0095', label: 'Purple' }, // purple.less
  { name: 'azure', hex: '#2dc3e8', label: 'Azure' }, // azure.less
  { name: 'black', hex: '#474544', label: 'Black' }, // black.less
  { name: 'blue', hex: '#5db2ff', label: 'Blue' }, // Blue.less
];

const STORAGE_KEY = 'ui.theme.v1';

/** ✅ Estado por defecto: skin 'colibri' */
const DEFAULT_STATE: ThemeState = {
  theme: 'light',
  skin: 'colibri',
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _state = signal<ThemeState>(this._read() ?? DEFAULT_STATE);

  readonly theme = computed(() => this._state().theme);
  readonly skin = computed(() => this._state().skin);
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    // Aplica inmediatamente y en cada cambio
    this._applyToDom(this._state());
    effect(() => {
      const s = this._state();
      this._write(s);
      this._applyToDom(s);
    });
  }

  setTheme(theme: ThemeName): void {
    if (theme !== this._state().theme) {
      this._state.update((s) => ({ ...s, theme }));
    }
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setSkin(skin: SkinName): void {
    if (skin !== this._state().skin) {
      this._state.update((s) => ({ ...s, skin }));
    }
  }

  // --- Persistencia ---
  private _write(s: ThemeState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* no-op */
    }
  }

  private _read(): ThemeState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as Partial<ThemeState>;
      const theme: ThemeName = parsed.theme === 'dark' ? 'dark' : 'light';

      const validSkins: readonly SkinName[] = [
        'azure',
        'black',
        'blue',
        'colibri',
        'darkblue',
        'darkred',
        'deepblue',
        'gray',
        'green',
        'orange',
        'pink',
        'purple',
        'teal',
      ] as const;

      const skin: SkinName = validSkins.includes(parsed.skin!)
        ? parsed.skin!
        : 'colibri'; // fallback seguro

      return { theme, skin };
    } catch {
      return null;
    }
  }

  // --- Aplicación al DOM ---
  private _applyToDom(s: ThemeState): void {
    const root = document.documentElement;
    root.setAttribute('data-bs-theme', s.theme);
    root.dataset['skin'] = s.skin; // útil para selectores [data-skin="colibri"]

    // Para compatibilidad con estilos legacy basados en clases:
    const body = document.body;
    [...body.classList].forEach(
      (c) => c.startsWith('skin-') && body.classList.remove(c),
    );
    body.classList.add(`skin-${s.skin}`);
  }
}
