// src/app/features/demo/shared/shared-showcase.page.ts
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import { ProgressbarComponent } from '@shared/components/progressbar/progressbar.component';
import { AlertComponent } from '@shared/components/alert/alert.component';
import { ChronoComponent } from '@shared/components/chrono/chrono.component';
import { TranslatorService } from '@core/services/translator.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-shared-showcase',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SHARED_IMPORTS,
    TranslateModule,
    ProgressbarComponent,
    AlertComponent,
    ChronoComponent,
  ],
  templateUrl: './shared-showcase.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedShowcasePage {
  // ===== Demo de componentes =====
  percent = 35;
  segments = [
    { value: 20, type: 'success' as const, label: 'OK' },
    { value: 10, type: 'warning' as const, label: 'Warn' },
    { value: 5, type: 'danger' as const, label: 'Err' },
  ];
  now = new Date();

  // ===== i18n =====
  private readonly translator = inject(TranslatorService);
  private readonly t = inject(TranslateService);

  langs = this.translator.getAvailableLanguages();
  current = signal<string>(
    (localStorage.getItem('i18n.lang') as string) ||
      this.t.currentLang ||
      this.t.getDefaultLang() ||
      'es_CO'
  );

  chronoLocale = computed(() => this.mapChronoLocale(this.current()));
  chronoTz = computed(() => this.mapChronoTz(this.current()));

  onLangChange(code: string) {
    this.current.set(code);
    this.translator.useLanguage(code);
  }

  private mapChronoLocale(code: string): string {
    switch (code) {
      case 'es_CO':
        return 'es-CO';
      case 'es_EC':
        return 'es-EC';
      case 'en_US':
        return 'en-US';
      case 'es_AR':
        return 'es-AR';
      default:
        return 'en-US';
    }
  }
  private mapChronoTz(code: string): string {
    switch (code) {
      case 'es_CO':
        return 'America/Bogota';
      case 'es_EC':
        return 'America/Guayaquil';
      case 'en_US':
        return 'America/New_York';
      case 'es_AR':
        return 'America/Argentina/Buenos_Aires';
      default:
        return 'America/Bogota';
    }
  }
}
