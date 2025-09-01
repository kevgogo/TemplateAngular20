import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { DxSchedulerModule } from 'devextreme-angular';

type Appt = {
  id: number;
  text: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  ownerId?: number;
  statusId?: number;
};

type Resource = {
  fieldExpr: string; // propiedad de la cita (ej: ownerId)
  label: string; // etiqueta que muestra el scheduler
  allowMultiple?: boolean;
  dataSource: { id: number; text: string; color?: string }[];
};

@Component({
  standalone: true,
  selector: 'app-scheduler-demo-page',
  imports: [CommonModule, DxSchedulerModule],
  templateUrl: './scheduler-demo.page.html',
  styleUrls: ['./scheduler-demo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SchedulerDemoPage {
  // Config básica
  currentDate = signal<Date>(this.toColombiaTodayAt(9)); // 9:00 a.m. hoy
  currentView = signal<'day' | 'week' | 'workWeek' | 'month' | 'agenda'>(
    'week',
  );
  views: Array<'day' | 'week' | 'workWeek' | 'month' | 'agenda'> = [
    'day',
    'week',
    'workWeek',
    'month',
    'agenda',
  ];

  // Resources para agrupar/colorear (ejemplo genérico para "dueños" y "estado")
  resources: Resource[] = [
    {
      fieldExpr: 'ownerId',
      label: 'Recurso',
      dataSource: [
        { id: 1, text: 'Refrigerado 01', color: '#1CA5B8' }, // primario Colibrí
        { id: 2, text: 'Bodega A', color: '#57A641' }, // éxito
        { id: 3, text: 'Bodega B', color: '#F29F05' }, // alerta
      ],
    },
    {
      fieldExpr: 'statusId',
      label: 'Estado',
      dataSource: [
        { id: 10, text: 'Programado', color: 'var(--border-color, #C4D0D9)' },
        { id: 20, text: 'En curso', color: 'var(--primary-600, #1CA5B8)' },
        { id: 30, text: 'Completado', color: '#57A641' },
      ],
    },
  ];

  // Datos demo
  appointments = signal<Appt[]>(this.generateDemoAppointments());

  // Altura responsiva simple (opcional)
  height = computed(() =>
    Math.max(620, Math.min(window.innerHeight - 220, 900)),
  );

  // === Helpers ===
  private toColombiaTodayAt(hour: number, minutes = 0) {
    // América/Bogotá sin DST. Usamos la hora local del navegador y forzamos HH:MM.
    const d = new Date();
    d.setHours(hour, minutes, 0, 0);
    return d;
  }

  private addHours(base: Date, hours: number) {
    const d = new Date(base);
    d.setHours(d.getHours() + hours);
    return d;
  }

  private generateDemoAppointments(): Appt[] {
    const base = this.toColombiaTodayAt(9); // 9:00 a.m.
    return [
      {
        id: 1,
        text: 'Mantenimiento preventivo',
        startDate: base,
        endDate: this.addHours(base, 2),
        ownerId: 1,
        statusId: 20,
      },
      {
        id: 2,
        text: 'Inspección llantas',
        startDate: this.toColombiaTodayAt(11, 30),
        endDate: this.toColombiaTodayAt(12, 30),
        ownerId: 1,
        statusId: 10,
      },
      {
        id: 3,
        text: 'Recepción bodega A',
        startDate: this.toColombiaTodayAt(14),
        endDate: this.toColombiaTodayAt(16),
        ownerId: 2,
        statusId: 20,
      },
      {
        id: 4,
        text: 'Salida bodega B',
        startDate: this.toColombiaTodayAt(10),
        endDate: this.toColombiaTodayAt(11),
        ownerId: 3,
        statusId: 30,
      },
      {
        id: 5,
        text: 'Sanitización vehículo',
        startDate: this.toColombiaTodayAt(16),
        endDate: this.toColombiaTodayAt(17),
        ownerId: 1,
        statusId: 10,
      },
    ];
  }
}
