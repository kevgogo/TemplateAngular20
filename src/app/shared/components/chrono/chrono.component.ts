import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, NEVER, interval } from 'rxjs';
import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';

import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import tz from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

type Mode = 'clock' | 'since' | 'stopwatch' | 'timer';
type LabelMode = 'clockPattern' | 'ago' | 'dhms' | 'human';
type ElapsedUnit =
  | 'ms'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'years';
type EmitUnits = ElapsedUnit | 'all';
type Rounding = 'none' | 'round' | 'floor' | 'ceil';

/**
 * Componente unificado: reloj + time-since + stopwatch + timer
 * - Controlado desde fuera con #chrono: start(), pause(), resume(), reset(), startTimer(), resetTimer()
 * - Formato de fecha/parseo fijo MM/DD/YYYY (y HH:mm:ss cuando aplique)
 */
@Component({
  selector: 'app-chrono',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span style="font-variant-numeric: tabular-nums">{{ label() }}</span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChronoComponent {
  /** ====== Modo ====== */
  @Input() mode: Mode = 'clock';

  /** ====== i18n / zona ====== */
  // Afecta textos “ago/human” y zona horaria. NO cambia el orden de fecha (que es fijo).
  @Input() localeTag = 'es-CO'; // 'es-EC' | 'es-CO' | 'en-US' ...
  @Input() tz: string | null = 'America/Bogota';

  /** ====== Render ====== */
  // 'clockPattern' (reloj), 'ago', 'dhms', 'human'
  @Input() labelMode: LabelMode = 'clockPattern';
  // Reloj SIEMPRE en MM/DD/YYYY salvo que cambies este patrón
  @Input() clockPattern = 'MM/DD/YYYY HH:mm:ss';

  /** ====== Parseo de strings (from/until) ====== */
  // Asegura MM/DD/YYYY HH:mm:ss; si llega solo fecha, usamos MM/DD/YYYY
  @Input() inputPattern = 'MM/DD/YYYY HH:mm:ss';

  /** ====== Ticks / pausa ====== */
  @Input() tick = 1000;
  private paused$ = new BehaviorSubject<boolean>(false);
  private _paused = false;
  @Input() set paused(v: boolean) {
    this._paused = !!v;
    this.paused$.next(this._paused);
  }

  /** ====== Since / Stopwatch ====== */
  @Input() from: Date | string | number | null = null;

  /** ====== Timer ====== */
  // Fecha fin absoluta O duración (si ambos, gana until)
  @Input() until: Date | string | number | null = null;
  @Input() durationMs: number | null = null;
  @Input() autoStopOnComplete = true; // detener al llegar a 0
  @Input() allowNegative = false; // permitir negativos después de 0

  /** ====== Emisiones ====== */
  @Input() emitUnits: EmitUnits = 'seconds';
  @Input() decimals = 0;
  @Input() rounding: Rounding = 'round';

  @Output() elapsedChange = new EventEmitter<
    number | Record<ElapsedUnit, number>
  >(); // since/stopwatch
  @Output() remainingChange = new EventEmitter<number>(); // timer
  @Output() completed = new EventEmitter<void>(); // timer

  /** ====== Estado interno timer ====== */
  private endAtMs: number | null = null; // instante fijo de fin para durationMs

  /** ====== Reloj interno ====== */
  private readonly ticks$ = this.paused$.pipe(
    switchMap((p) => (p ? NEVER : interval(this.tick))),
    startWith(0),
  );
  private readonly nowMs = toSignal(this.ticks$.pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  /** ====== API pública (control con #chrono) ====== */
  public start(): void {
    if ((this.mode === 'stopwatch' || this.mode === 'since') && !this.from)
      this.from = Date.now();
    this.resume();
  }
  public pause(): void {
    this._paused = true;
    this.paused$.next(true);
  }
  public resume(): void {
    this._paused = false;
    this.paused$.next(false);
  }
  public reset(): void {
    if (this.mode === 'stopwatch') this.from = null;
    this.pause();
  }

  public startTimer(): void {
    if (this.mode !== 'timer') return;
    const now = this.nowMs();
    if (this.until) {
      const end = this.parse(this.until);
      this.endAtMs = end ? end.valueOf() : null;
    } else if (this.durationMs != null) {
      this.endAtMs = now + this.durationMs;
    }
    this.resume();
  }
  public resetTimer(): void {
    if (this.mode === 'timer') {
      this.pause();
      this.endAtMs = null;
    }
  }

  /** ====== Helpers ====== */
  private lang(): 'es' | 'en' {
    return (this.localeTag || '').toLowerCase().startsWith('en') ? 'en' : 'es';
  }
  private zone(): string {
    return this.tz ?? dayjs.tz.guess();
  }

  private parse(val: Date | string | number | null | undefined) {
    if (val == null) return null;
    const zone = this.zone();
    const lang = this.lang();
    if (typeof val === 'string') {
      // Si el string no trae hora clara, usamos solo fecha
      const hasTime = /:\d{2}/.test(val);
      const pattern = hasTime ? this.inputPattern : 'MM/DD/YYYY';
      return dayjs.tz(val, pattern, zone).locale(lang);
    }
    return dayjs(val).tz(zone).locale(lang);
  }

  private round(v: number): number {
    if (this.rounding === 'none') {
      if (!this.decimals || this.decimals <= 0) return v;
      const f = Math.pow(10, this.decimals);
      return Math.trunc(v * f) / f;
    }
    const f = Math.pow(10, this.decimals || 0);
    const op =
      this.rounding === 'floor'
        ? Math.floor
        : this.rounding === 'ceil'
          ? Math.ceil
          : Math.round;
    return op(v * f) / f;
  }

  private unitsFrom(diffMs: number): Record<ElapsedUnit, number> {
    const d = dayjs.duration(diffMs);
    return {
      ms: diffMs,
      seconds: d.asSeconds(),
      minutes: d.asMinutes(),
      hours: d.asHours(),
      days: d.asDays(),
      weeks: d.asWeeks(),
      months: d.asMonths(),
      years: d.asYears(),
    };
  }

  private emitFromDiff(diffMs: number): void {
    const u = this.unitsFrom(diffMs);
    if (this.emitUnits === 'all') {
      // Construimos el record tipado explícitamente, sin `any`
      const out: Record<ElapsedUnit, number> = {
        ms: this.round(u.ms),
        seconds: this.round(u.seconds),
        minutes: this.round(u.minutes),
        hours: this.round(u.hours),
        days: this.round(u.days),
        weeks: this.round(u.weeks),
        months: this.round(u.months),
        years: this.round(u.years),
      };
      this.elapsedChange.emit(out);
    } else {
      this.elapsedChange.emit(this.round(u[this.emitUnits]));
    }
  }

  private humanLabel(
    days: number,
    hours: number,
    mins: number,
    dirDown: boolean,
  ): string {
    const en = this.lang() === 'en';
    const t = en
      ? {
          d1: 'day',
          dN: 'days',
          h1: 'hour',
          hN: 'hours',
          m1: 'minute',
          mN: 'minutes',
          T: 'T− ',
        }
      : {
          d1: 'día',
          dN: 'días',
          h1: 'hora',
          hN: 'horas',
          m1: 'minuto',
          mN: 'minutos',
          T: 'T− ',
        };
    const parts: string[] = [];
    if (days) parts.push(`${days} ${days === 1 ? t.d1 : t.dN}`);
    if (hours) parts.push(`${hours} ${hours === 1 ? t.h1 : t.hN}`);
    parts.push(`${mins} ${mins === 1 ? t.m1 : t.mN}`);
    return (dirDown ? t.T : '') + parts.join(', ');
  }

  /** ====== Render principal ====== */
  readonly label = toSignal(
    this.ticks$.pipe(
      map(() => this.computeLabel()),
      distinctUntilChanged(),
    ),
    { initialValue: this.computeLabel() },
  );

  private computeLabel(): string {
    const zone = this.zone(),
      lang = this.lang();
    const now = dayjs(this.nowMs()).tz(zone).locale(lang);

    // CLOCK
    if (this.mode === 'clock') {
      return now.format(this.clockPattern); // por defecto: MM/DD/YYYY HH:mm:ss
    }

    // SINCE / STOPWATCH
    if (this.mode === 'since' || this.mode === 'stopwatch') {
      const start = this.parse(this.from) ?? now;
      const diffMs = now.diff(start);
      this.emitFromDiff(diffMs);

      const d = dayjs.duration(Math.abs(diffMs));
      const days = Math.floor(d.asDays());
      const hh = String(d.hours()).padStart(2, '0');
      const mm = String(d.minutes()).padStart(2, '0');
      const ss = String(d.seconds()).padStart(2, '0');

      if (this.labelMode === 'ago') return start.from(now); // "hace X / in X"
      if (this.labelMode === 'human')
        return this.humanLabel(days, d.hours(), d.minutes(), false);
      return `${days}d ${hh}:${mm}:${ss}`; // dhms
    }

    // TIMER
    // Si hay until, fijamos fin absoluto; si no, esperamos a startTimer() para durationMs
    if (this.until) {
      const end = this.parse(this.until);
      this.endAtMs = end ? end.valueOf() : null;
    }

    if (this.endAtMs == null) {
      this.remainingChange.emit(this.durationMs ?? 0);
      return `T− 0d 00:00:00`;
    }

    let remaining = this.endAtMs - now.valueOf();
    const crossed = remaining <= 0;
    if (!this.allowNegative && remaining < 0) remaining = 0;

    this.remainingChange.emit(remaining);
    if (crossed && this.autoStopOnComplete) {
      this.pause();
      this.completed.emit();
    }

    const d = dayjs.duration(Math.abs(remaining));
    const days = Math.floor(d.asDays());
    const hh = String(d.hours()).padStart(2, '0');
    const mm = String(d.minutes()).padStart(2, '0');
    const ss = String(d.seconds()).padStart(2, '0');

    if (this.labelMode === 'ago') {
      const base = dayjs(0).locale(lang);
      return base.from(base.add(d)); // “en X / in X”
    }
    if (this.labelMode === 'human')
      return this.humanLabel(days, d.hours(), d.minutes(), true);
    return `T− ${days}d ${hh}:${mm}:${ss}`; // dhms
  }
}
