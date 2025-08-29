import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type FaVersionKey = 'v4' | 'v5' | 'v6' | 'v7';

export interface FaIconMeta {
  id: string;
  en?: string;
  es?: string;
}

const CSS_OFFLINE_URLS: Record<FaVersionKey, string> = {
  v4: '/assets/fontawesome/v4/css/font-awesome.min.css',
  v5: '/assets/fontawesome/v5/css/all.min.css',
  v6: '/assets/fontawesome/v6/css/all.min.css',
  v7: '/assets/fontawesome/v7/css/all.min.css',
};

const CSS_CDN_URLS: Record<FaVersionKey, string> = {
  v4: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  v5: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  v6: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
  v7: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css',
};

const OFFLINE_JSON = '/assets/fa-icons.json';

const UTILITIES = new Set([
  'lg',
  'xs',
  'sm',
  '1x',
  '2x',
  '3x',
  '4x',
  '5x',
  '6x',
  '7x',
  '8x',
  '9x',
  '10x',
  '2xl',
  'xl',
  'fw',
  'ul',
  'li',
  'border',
  'pull-left',
  'pull-right',
  'inverse',
  'swap-opacity',
  'sr-only',
  'spin',
  'pulse',
  'beat',
  'fade',
  'beat-fade',
  'bounce',
  'flip',
  'flip-both',
  'flip-horizontal',
  'flip-vertical',
  'rotate-90',
  'rotate-180',
  'rotate-270',
  'rotate-by',
  'rotate',
  'shake',
  'spin-reverse',
  'stack',
  'stack-1x',
  'stack-2x',
  'layers',
  'layers-text',
  'layers-counter',
  'primary',
  'secondary',
  'fixed-width',
]);

@Injectable({ providedIn: 'root' })
export class FaCssParserService {
  private http = inject(HttpClient);
  private injected = new Set<FaVersionKey>();
  private offlineCache: Record<FaVersionKey, FaIconMeta[]> | null | undefined;

  async getIconsMeta(version: FaVersionKey): Promise<FaIconMeta[]> {
    const json = await this.tryLoadOfflineJson(); // 1) EN/ES offline (recomendado)
    if (json && Array.isArray(json[version])) return json[version]!;

    // 2) Parseo CSS (offline si existe; si no, CDN)
    await this.ensureCssLoaded(version);
    const css = await this.fetchCssText(version);
    const ids = this.extractIconIds(css, version);
    return ids.map((id) => ({ id, en: id.replace(/-/g, ' ') }));
  }

  async ensureCssLoaded(version: FaVersionKey): Promise<void> {
    if (this.injected.has(version)) return;
    const href = await this.getCssHref(version);
    await this.injectLinkOnce(href);
    this.injected.add(version);
  }

  // ---------- internos ----------
  private async getCssHref(version: FaVersionKey): Promise<string> {
    try {
      const res = await firstValueFrom(
        this.http.get(CSS_OFFLINE_URLS[version], { responseType: 'text' })
      );
      if (res) return CSS_OFFLINE_URLS[version];
    } catch {}
    return CSS_CDN_URLS[version];
  }

  private async tryLoadOfflineJson(): Promise<Record<
    FaVersionKey,
    FaIconMeta[]
  > | null> {
    if (this.offlineCache !== undefined) return this.offlineCache;
    try {
      const res = await firstValueFrom(
        this.http.get<Record<FaVersionKey, FaIconMeta[]>>(OFFLINE_JSON)
      );
      this.offlineCache = res;
      return res;
    } catch {
      this.offlineCache = null;
      return null;
    }
  }

  private async fetchCssText(version: FaVersionKey): Promise<string> {
    try {
      return await firstValueFrom(
        this.http.get(CSS_OFFLINE_URLS[version], { responseType: 'text' })
      );
    } catch {
      return await firstValueFrom(
        this.http.get(CSS_CDN_URLS[version], { responseType: 'text' })
      );
    }
  }

  private injectLinkOnce(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const exists = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]')
      ).some((l) => (l as HTMLLinkElement).href.includes(href));
      if (exists) return resolve();

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`No se pudo cargar: ${href}`));
      document.head.appendChild(link);
    });
  }

  private extractIconIds(cssText: string, version: FaVersionKey): string[] {
    if (version === 'v7') {
      // FA7: grupos .fa-xx,.fa-yy{ --fa:"\f..." }
      const ids = new Set<string>();
      const blockRe =
        /((?:\.fa-[a-z0-9-]+(?:\s*,\s*)?)+)\s*{[^}]*--fa(?:-[a-z0-9-]+)?\s*:\s*["']\\[0-9a-f]{3,6}["'][^}]*}/gi;
      let m: RegExpExecArray | null;
      while ((m = blockRe.exec(cssText))) {
        const group = m[1];
        group.replace(/\.fa-([a-z0-9-]+)/gi, (_, id) => {
          if (!UTILITIES.has(id)) ids.add(id);
          return '';
        });
      }
      // :root { --fa-var-xyz:"\f..." } — por si aparece
      const reRoot = /--fa-var-([a-z0-9-]+)\s*:\s*["']\\[0-9a-f]{3,6}["']/gi;
      while ((m = reRoot.exec(cssText))) {
        const id = m[1];
        if (!UTILITIES.has(id)) ids.add(id);
      }
      return [...ids].sort();
    }

    // v4..v6
    const ids = new Set<string>();
    const reContentDirect =
      /\.fa-([a-z0-9-]+)\s*::?before\s*{[^}]*content\s*:\s*["']\\[0-9a-f]{3,6}["'][^}]*}/gi;
    const reContentVarAny =
      /\.fa-([a-z0-9-]+)\s*::?before\s*{[^}]*content\s*:\s*var\(--fa-[a-z0-9-]+(?:\s*,\s*["']\\[0-9a-f]{3,6}["'])?\)[^}]*}/gi;
    const rePropOnBefore =
      /\.fa-([a-z0-9-]+)\s*::?before\s*{[^}]*--fa-[a-z0-9-]+\s*:\s*["']\\[0-9a-f]{3,6}["'][^}]*}/gi;
    const rePropOnClass =
      /\.fa-([a-z0-9-]+)\s*{[^}]*--fa-[a-z0-9-]+\s*:\s*["']\\[0-9a-f]{3,6}["'][^}]*}/gi;
    const reRootVars = /--fa-var-([a-z0-9-]+)\s*:\s*["']\\[0-9a-f]{3,6}["']/gi;
    const reContentVarPerIcon =
      /\.fa-[a-z0-9-]+\s*::?before\s*{[^}]*content\s*:\s*var\(--fa-var-([a-z0-9-]+)\)[^}]*}/gi;

    for (const re of [
      reContentDirect,
      reContentVarAny,
      rePropOnBefore,
      rePropOnClass,
    ]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(cssText)) !== null) {
        const id = m[1];
        if (!UTILITIES.has(id)) ids.add(id);
      }
    }
    {
      let m: RegExpExecArray | null;
      while ((m = reRootVars.exec(cssText)) !== null)
        if (!UTILITIES.has(m[1])) ids.add(m[1]);
    }
    {
      let m: RegExpExecArray | null;
      while ((m = reContentVarPerIcon.exec(cssText)) !== null)
        if (!UTILITIES.has(m[1])) ids.add(m[1]);
    }

    return [...ids].sort();
  }
}
