import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

type NavigatorLegacy = Navigator & {
  userLanguage?: string;
  browserLanguage?: string;
};

@Injectable({ providedIn: 'root' })
export class TranslatorService {
  private readonly translate = inject(TranslateService);

  private readonly fallbackLanguage = 'es_CO';

  private readonly availablelangs: { code: string; text: string }[] = [
    { code: 'es_CO', text: 'Español (Colombia)' },
    { code: 'es_EC', text: 'Español (Ecuador)' },
    { code: 'en_US', text: 'English (US)' },
  ];

  private readonly STORAGE_KEY = 'i18n.lang';

  constructor() {
    this.translate.addLangs(this.availablelangs.map((l) => l.code));

    this.translate.setFallbackLang(this.fallbackLanguage).subscribe();

    const stored = this.normalize(localStorage.getItem(this.STORAGE_KEY) ?? '');
    const browser = this.normalize(this.detectBrowserLang());
    const current = this.normalize(this.translate.getCurrentLang());
    const fallback =
      this.normalize(this.translate.getFallbackLang()) ?? this.fallbackLanguage;

    const active = stored ?? current ?? fallback ?? browser;
    this.translate.use(active);
  }

  useLanguage(lang?: string): void {
    const target =
      this.normalize(lang) ??
      this.normalize(this.translate.getFallbackLang()) ??
      this.fallbackLanguage;

    this.translate.use(target);
    localStorage.setItem(this.STORAGE_KEY, target);
  }

  getAvailableLanguages() {
    return this.availablelangs;
  }

  private normalize(code?: string | null): string | null {
    if (!code) return null;
    const c = code.replace('-', '_');

    const exact = this.availablelangs.find(
      (l) => l.code.toLowerCase() === c.toLowerCase(),
    )?.code;
    if (exact) return exact;

    const base = c.split(/[-_]/)[0];
    const byBase = this.availablelangs.find((l) =>
      l.code.toLowerCase().startsWith(base.toLowerCase()),
    )?.code;
    return byBase ?? null;
  }

  private detectBrowserLang(): string {
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as NavigatorLegacy)
        : undefined;

    return (
      nav?.languages?.[0] ??
      nav?.language ??
      nav?.userLanguage ??
      nav?.browserLanguage ??
      ''
    );
  }
}
