import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslatorService {
  private readonly translate = inject(TranslateService);

  // Fallback por defecto (ajústalo si lo prefieres a es_CO o es_EC)
  private readonly fallbackLanguage = 'es_AR';

  // Idiomas soportados por tus archivos en assets/i18n/
  private readonly availablelangs: Array<{ code: string; text: string }> = [
    { code: 'es_CO', text: 'Español (Colombia)' },
    { code: 'es_EC', text: 'Español (Ecuador)' },
    { code: 'es_AR', text: 'Español (Argentina)' },
    { code: 'en_US', text: 'English (US)' },
    { code: 'en', text: 'English' },
  ];

  private readonly STORAGE_KEY = 'i18n.lang';

  constructor() {
    this.translate.addLangs(this.availablelangs.map((l) => l.code));

    this.translate.setFallbackLang(this.fallbackLanguage).subscribe();

    // Orden de resolución del idioma activo:
    // 1) almacenado en localStorage
    // 2) currentLang ya activo en el servicio
    // 3) fallbackLang
    // 4) fallbackLanguage local
    // 5) idioma del navegador
    const stored = this.normalize(localStorage.getItem(this.STORAGE_KEY) || '');
    const browser = this.normalize(this.detectBrowserLang());
    const current = this.normalize(this.translate.getCurrentLang());
    const fallback =
      this.normalize(this.translate.getFallbackLang()) ?? this.fallbackLanguage;

    const active = stored ?? current ?? fallback ?? browser;
    this.translate.use(active);
  }

  /** Cambia el idioma y lo persiste */
  useLanguage(lang?: string): void {
    const target =
      this.normalize(lang) ??
      this.normalize(this.translate.getFallbackLang()) ??
      this.fallbackLanguage;

    this.translate.use(target);
    localStorage.setItem(this.STORAGE_KEY, target);
  }

  /** Lista de idiomas disponibles (códigos y etiquetas) */
  getAvailableLanguages() {
    return this.availablelangs;
  }

  /** Normaliza códigos: 'es-CO' → 'es_CO'; intenta base 'es' si el exacto no existe */
  private normalize(code?: string | null): string | null {
    if (!code) return null;
    const c = code.replace('-', '_');

    // Coincidencia exacta
    const exact = this.availablelangs.find(
      (l) => l.code.toLowerCase() === c.toLowerCase()
    )?.code;
    if (exact) return exact;

    // Coincidencia por idioma base (es, en, etc.)
    const base = c.split(/[-_]/)[0];
    const byBase = this.availablelangs.find((l) =>
      l.code.toLowerCase().startsWith(base.toLowerCase())
    )?.code;
    return byBase ?? null;
  }

  /** Intenta detectar el idioma del navegador */
  private detectBrowserLang(): string {
    // p.ej. 'es-CO', 'en-US', 'es'
    const nav =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      '';
    return nav || '';
  }
}
