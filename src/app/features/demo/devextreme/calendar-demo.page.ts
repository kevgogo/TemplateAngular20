// src/app/features/demo/devextreme/calendar-demo.page.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// IMPORTANTE: requiere instalar devextreme y devextreme-angular
// npm i devextreme devextreme-angular
// Importamos el módulo standalone del Calendar
import { DxCalendarModule } from 'devextreme-angular';

@Component({
  selector: 'app-calendar-demo',
  standalone: true,
  imports: [CommonModule, DxCalendarModule],
  templateUrl: './calendar-demo.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDemoPage {
  value: Date = new Date();
  min: Date = new Date(new Date().getFullYear(), 0, 1);
  max: Date = new Date(new Date().getFullYear(), 11, 31);
}
