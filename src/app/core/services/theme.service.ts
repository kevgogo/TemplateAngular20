import { Injectable, computed, effect, signal } from '@angular/core';

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
  hex: string;
  label: string;
}

export interface ThemeState {
  theme: ThemeName;
  skin: SkinName;
}

/** Opciones de skin para tu selector en UI */
export const SKIN_OPTIONS: SkinOption[] = [
  { name: 'colibri', hex: '#03b3b2', label: 'Colibri' },
  { name: 'darkblue', hex: '#0072c6', label: 'Dark Blue' },
  { name: 'darkred', hex: '#ac193d', label: 'Dark Red' },
  { name: 'deepblue', hex: '#001940', label: 'Deep Blue' },
  { name: 'gray', hex: '#585858', label: 'Gray' },
  { name: 'green', hex: '#53a93f', label: 'Green' },
  { name: 'orange', hex: '#ff8f32', label: 'Orange' },
  { name: 'pink', hex: '#cc324b', label: 'Pink' },
  { name: 'purple', hex: '#8c0095', label: 'Purple' },
  { name: 'azure', hex: '#2dc3e8', label: 'Azure' },
  { name: 'black', hex: '#474544', label: 'Black' },
  { name: 'blue', hex: '#5db2ff', label: 'Blue' },
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
        : 'colibri';

      return { theme, skin };
    } catch {
      return null;
    }
  }

  private _applyToDom(s: ThemeState): void {
    const root = document.documentElement;
    root.setAttribute('data-bs-theme', s.theme);
    root.dataset['skin'] = s.skin;

    const body = document.body;
    [...body.classList].forEach(
      (c) => c.startsWith('skin-') && body.classList.remove(c),
    );
    body.classList.add(`skin-${s.skin}`);
  }
}
