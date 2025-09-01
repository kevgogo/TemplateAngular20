import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TranslatorService } from '@core/services/translator.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SHARED_IMPORTS } from '@shared/app-shared-imports';
import { SwalPortalTargets } from '@sweetalert2/ngx-sweetalert2';

@Component({
  selector: 'app-shared-showcase',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, SHARED_IMPORTS],
  templateUrl: './shared-showcase.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedShowcasePage {
  private _toastr = inject(ToastrService);
  public readonly swalTargets = inject(SwalPortalTargets);

  protected readonly Math = Math;

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
    (localStorage.getItem('i18n.lang')!) ||
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

  // ✅ MÉTODO PÚBLICO (lo llama el HTML)
  toast(kind: 'success' | 'info' | 'warning' | 'error') {
    switch (kind) {
      case 'success':
        this._toastr.success('Operación exitosa', 'OK');
        break;
      case 'info':
        this._toastr.info('Dato informativo');
        break;
      case 'warning':
        this._toastr.warning('Atención', 'Cuidado');
        break;
      case 'error':
        this._toastr.error('Algo falló', 'Error');
        break;
    }
  }
}
